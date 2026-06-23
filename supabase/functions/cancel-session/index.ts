// ⚠️ REFERENCE COPY — OWNED & DEPLOYED FROM THE MOBILE REPO. Per the web/mobile
// ownership split, do NOT `supabase functions deploy cancel-session` from
// rollwisev2. Kept for reference/local dev; the web client calls the version
// mobile deploys. See supabase/STRIPE.md.
//
// cancel-session — cancels a coaching session on behalf of its coach (or admin).
//
// This is the coach-side analogue of cancel-booking. When a session is cancelled,
// every ACTIVE paid booking on it is refunded via Stripe (reverse_transfer +
// refund_application_fee). As with cancel-booking, it does NOT mutate the paid
// booking rows itself: the resulting `charge.refunded` webhook flips each row to
// refunded/cancelled and frees its seat, so a failed refund can never strand a
// student who paid. Unpaid/pending bookings (which hold no seat and no money) are
// cancelled directly with the service-role key. Only once EVERY paid booking has
// been refunded is the session marked cancelled — so a cancelled session never
// leaves a paid student un-refunded.
//
// The caller is identified from their Supabase JWT; only the session's coach or an
// admin may cancel it. Stripe is called with the secret key, server-side only.
//
// Deploy: supabase functions deploy cancel-session
// Secrets needed: STRIPE_SECRET_KEY (SUPABASE_URL / *_KEY are injected).

import Stripe from 'npm:stripe@^16.12.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';
import { corsHeaders, json } from '../_shared/cors.ts';
import { refundChargeByPaymentIntent } from '../_shared/refund.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Identify the caller from their JWT.
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Not authenticated' }, 401);

    const { sessionId } = await req.json();
    if (!sessionId) return json({ error: 'sessionId is required' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: session, error: sErr } = await admin
      .from('sessions')
      .select('id, coach_id, status')
      .eq('id', sessionId)
      .maybeSingle();
    if (sErr) return json({ error: sErr.message }, 500);
    if (!session) return json({ error: 'Session not found.' }, 404);

    // Only the session's coach or an admin may cancel it.
    if (session.coach_id !== user.id) {
      const { data: me } = await admin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (me?.role !== 'admin') {
        return json({ error: 'You can’t cancel this session.' }, 403);
      }
    }

    // Idempotent / non-cancellable states.
    if (session.status === 'cancelled') return json({ ok: true, alreadyCancelled: true });
    if (session.status === 'completed')
      return json({ error: 'Completed sessions can’t be cancelled.' }, 409);

    // Every non-cancelled booking attached to this session.
    const { data: bookings, error: bErr } = await admin
      .from('bookings')
      .select('id, payment_status')
      .eq('session_id', session.id)
      .neq('status', 'cancelled');
    if (bErr) return json({ error: bErr.message }, 500);

    const active = bookings ?? [];
    const paid = active.filter((b) => b.payment_status === 'paid');
    const unpaid = active.filter((b) => b.payment_status !== 'paid');

    // Refund every paid booking through Stripe. The charge.refunded webhook then
    // cancels each booking and frees its seat. If ANY refund fails we abort
    // BEFORE cancelling the session, so a cancelled session never leaves a paid
    // student un-refunded.
    if (paid.length > 0) {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
        apiVersion: '2024-06-20',
      });

      const failures: string[] = [];
      for (const booking of paid) {
        const { data: payment } = await admin
          .from('payments')
          .select('stripe_payment_id')
          .eq('booking_id', booking.id)
          .eq('type', 'charge')
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .maybeSingle();

        const paymentIntent = (payment?.stripe_payment_id as string | null) ?? null;
        if (!paymentIntent) {
          failures.push(booking.id);
          continue;
        }

        try {
          // Prefers a destination-charge refund; falls back to a plain refund
          // when the charge has no associated transfer (legacy/seed charges).
          // An already-refunded charge is treated as success.
          await refundChargeByPaymentIntent(stripe, paymentIntent);
        } catch (e) {
          console.error('Refund failed during session cancel:', {
            session: session.id,
            booking: booking.id,
            error: e instanceof Error ? e.message : String(e),
          });
          failures.push(booking.id);
        }
      }

      if (failures.length > 0) {
        return json(
          {
            error:
              `Could not refund ${failures.length} of ${paid.length} paid booking(s); ` +
              `the session was left active. Please retry or contact support.`,
          },
          502,
        );
      }
    }

    // Unpaid / pending bookings hold no seat and no money — cancel them directly.
    // The service-role key bypasses the end-user column lock in security.sql.
    if (unpaid.length > 0) {
      const { error } = await admin
        .from('bookings')
        .update({ status: 'cancelled' })
        .in(
          'id',
          unpaid.map((b) => b.id),
        );
      if (error) return json({ error: error.message }, 500);
    }

    // Every paid student has been refunded — mark the session cancelled. The
    // service-role key bypasses the BEFORE trigger that blocks a direct
    // cancellation of a session with paid bookings. The paid bookings themselves
    // are finalized (cancelled, seat freed) by the charge.refunded webhook.
    const { error: cErr } = await admin
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', session.id);
    if (cErr) return json({ error: cErr.message }, 500);

    return json({ ok: true, cancelled: true, refunded: paid.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
