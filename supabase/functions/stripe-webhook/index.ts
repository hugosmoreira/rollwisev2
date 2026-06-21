// stripe-webhook — receives Stripe events and updates the DB.
// On a completed checkout it CREATES the booking (confirmed + paid) and records
// a payment. Idempotent on the Checkout session id so a duplicate delivery
// can't double-book. Verified with the Stripe webhook signing secret.
//
// IMPORTANT: this function must be deployed with JWT verification OFF
// (Stripe doesn't send a Supabase JWT). See supabase/config.toml.
//
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets needed: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// Optional (booking confirmation email): RESEND_API_KEY, EMAIL_FROM, APP_URL,
//   APP_TIMEZONE — see supabase/EMAIL.md. Email sending is best-effort and never
//   blocks the booking.

import Stripe from 'npm:stripe@^16.12.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';
import { sendBookingConfirmation } from '../_shared/email.ts';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2024-06-20',
  });
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (e) {
    return new Response(
      `Webhook signature verification failed: ${e instanceof Error ? e.message : e}`,
      { status: 400 },
    );
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    const sessionId = s.metadata?.session_id;
    const studentId = s.metadata?.student_id;
    const coachId = s.metadata?.coach_id;

    if (sessionId && studentId && coachId) {
      // Idempotency: if this Checkout session already produced a booking
      // (a duplicate webhook delivery), do nothing.
      const { data: existing } = await admin
        .from('bookings')
        .select('id')
        .eq('stripe_session_id', s.id)
        .maybeSingle();

      if (!existing) {
        // Atomically claim a seat. If the session filled up between checkout and
        // payment (race), refund the student rather than overbook.
        const { data: claimed, error: claimErr } = await admin.rpc(
          'claim_session_spot',
          { p_session_id: sessionId },
        );
        if (claimErr) {
          // RPC error (e.g. spots.sql not run yet) — don't refund; let Stripe
          // retry so it self-heals once the function exists.
          console.error('claim_session_spot failed:', {
            event: event.id,
            error: claimErr.message,
          });
          return new Response(`Spot claim failed: ${claimErr.message}`, {
            status: 500,
          });
        }
        if (!claimed) {
          if (typeof s.payment_intent === 'string') {
            try {
              await stripe.refunds.create({
                payment_intent: s.payment_intent,
                reverse_transfer: true,
                refund_application_fee: true,
              });
            } catch (e) {
              console.error('Full-session refund failed:', {
                event: event.id,
                error: e instanceof Error ? e.message : e,
              });
            }
          }
          console.error('Session full — refunded student', {
            event: event.id,
            session: sessionId,
          });
          return new Response(JSON.stringify({ received: true, refunded: true }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const { data: booking, error: bErr } = await admin
          .from('bookings')
          .insert({
            session_id: sessionId,
            student_id: studentId,
            coach_id: coachId,
            status: 'confirmed',
            payment_status: 'paid',
            stripe_session_id: s.id,
          })
          .select('id')
          .single();

        if (bErr) {
          // Insert failed (incl. 23505 dup from a concurrent delivery) — return
          // the claimed seat so capacity isn't leaked.
          await admin.rpc('release_session_spot', { p_session_id: sessionId });
          if ((bErr as { code?: string }).code !== '23505') {
            return new Response(`Booking insert failed: ${bErr.message}`, { status: 500 });
          }
        } else if (booking) {
          // All charges are destination charges with this platform fee.
          const feePct = Number(Deno.env.get('PLATFORM_FEE_PERCENT') ?? '10');
          // Same cents-rounding create-checkout used for application_fee_amount.
          const applicationFee =
            Math.round(((s.amount_total ?? 0) * feePct) / 100) / 100;
          const { error: pErr } = await admin.from('payments').insert({
            booking_id: booking.id,
            coach_id: coachId,
            amount: (s.amount_total ?? 0) / 100,
            application_fee: applicationFee,
            currency: (s.currency ?? 'usd').toUpperCase(),
            status: 'paid',
            type: 'charge',
            stripe_payment_id:
              typeof s.payment_intent === 'string' ? s.payment_intent : null,
          });
          if (pErr) {
            console.error('payments insert failed:', {
              event: event.id,
              booking: booking.id,
              error: pErr.message,
            });
          }

          // Best-effort booking confirmation email — never blocks the webhook.
          try {
            const [{ data: student }, { data: coach }, { data: sess }] =
              await Promise.all([
                admin.from('profiles').select('full_name, email').eq('id', studentId).maybeSingle(),
                admin.from('profiles').select('full_name').eq('id', coachId).maybeSingle(),
                admin
                  .from('sessions')
                  .select('title, starts_at, duration_minutes, city, gym_name, timezone')
                  .eq('id', sessionId)
                  .maybeSingle(),
              ]);

            if (student?.email && sess) {
              await sendBookingConfirmation({
                to: student.email,
                studentName: student.full_name || 'there',
                coachName: coach?.full_name || 'your coach',
                sessionTitle: sess.title,
                startsAt: sess.starts_at,
                durationMinutes: sess.duration_minutes,
                timezone: sess.timezone ?? 'UTC',
                location: sess.gym_name ? `${sess.gym_name} · ${sess.city}` : sess.city,
                amount: (s.amount_total ?? 0) / 100,
                currency: (s.currency ?? 'usd').toUpperCase(),
              });
            }
          } catch (e) {
            console.error(
              'Booking confirmation email failed:',
              e instanceof Error ? e.message : e,
            );
          }
        }
      }
    }
  }

  // A coach finished (or changed) their Connect onboarding — cache whether they
  // can now receive payouts, so the Earnings UI can reflect it.
  if (event.type === 'account.updated') {
    const acct = event.data.object as Stripe.Account;
    await admin
      .from('profiles')
      .update({ stripe_charges_enabled: acct.charges_enabled ?? false })
      .eq('stripe_account_id', acct.id);
  }

  // A charge was refunded (in the Stripe dashboard, or by our overbook handler):
  // cancel the booking, free its seat (via the spots trigger), and record it.
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    const pi =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
    if (pi) {
      const { data: pay } = await admin
        .from('payments')
        .select('booking_id, coach_id')
        .eq('stripe_payment_id', pi)
        .eq('type', 'charge')
        .maybeSingle();
      if (pay?.booking_id) {
        const { data: bk } = await admin
          .from('bookings')
          .select('payment_status')
          .eq('id', pay.booking_id)
          .maybeSingle();
        // Idempotent: only act the first time.
        if (bk && bk.payment_status !== 'refunded') {
          await admin
            .from('bookings')
            .update({ payment_status: 'refunded', status: 'cancelled' })
            .eq('id', pay.booking_id);
          await admin.from('payments').insert({
            booking_id: pay.booking_id,
            coach_id: pay.coach_id,
            amount: (charge.amount_refunded ?? 0) / 100,
            application_fee: 0,
            currency: (charge.currency ?? 'usd').toUpperCase(),
            status: 'refunded',
            type: 'refund',
            stripe_payment_id: pi,
          });
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
