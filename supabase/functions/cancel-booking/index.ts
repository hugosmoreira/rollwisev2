// cancel-booking — cancels a booking on behalf of one of its participants.
//
// For a PAID booking this issues a Stripe refund (reverse_transfer +
// refund_application_fee). It deliberately does NOT mutate the booking row: the
// resulting `charge.refunded` webhook is what flips the row to refunded/cancelled
// and frees the seat, so a failed refund can never free a paid seat without the
// money moving. UNPAID/pending bookings are cancelled directly with the
// service-role key (which bypasses the end-user column lock in security.sql).
//
// The caller is identified from their Supabase JWT; only the booking's student
// or coach may cancel it. Stripe is called with the secret key, server-side only.
//
// Deploy: supabase functions deploy cancel-booking
// Secrets needed: STRIPE_SECRET_KEY (SUPABASE_URL / *_KEY are injected).

import Stripe from 'npm:stripe@^16.12.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';
import { corsHeaders, json } from '../_shared/cors.ts';

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

    const { bookingId } = await req.json();
    if (!bookingId) return json({ error: 'bookingId is required' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('id, student_id, coach_id, status, payment_status')
      .eq('id', bookingId)
      .maybeSingle();
    if (bErr) return json({ error: bErr.message }, 500);
    if (!booking) return json({ error: 'Booking not found.' }, 404);

    // Only a participant (student or coach on the row) may cancel it.
    if (booking.student_id !== user.id && booking.coach_id !== user.id) {
      return json({ error: 'You can’t cancel this booking.' }, 403);
    }

    // Idempotent / non-cancellable states.
    if (booking.status === 'cancelled') return json({ ok: true, alreadyCancelled: true });
    if (booking.status === 'completed')
      return json({ error: 'Completed sessions can’t be cancelled here.' }, 409);

    // Unpaid / pending: no money has moved — cancel directly. The service-role
    // key bypasses the end-user column lock, so this is allowed.
    if (booking.payment_status !== 'paid') {
      const { error } = await admin
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, cancelled: true });
    }

    // Paid: locate the original charge and refund it via Stripe. The
    // charge.refunded webhook then cancels the booking and releases the seat.
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
      return json(
        {
          error:
            'Could not locate the original payment to refund. Please contact support.',
        },
        409,
      );
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-06-20',
    });
    try {
      await stripe.refunds.create({
        payment_intent: paymentIntent,
        reverse_transfer: true,
        refund_application_fee: true,
      });
    } catch (e) {
      return json(
        { error: `Refund failed: ${e instanceof Error ? e.message : String(e)}` },
        502,
      );
    }

    // The booking + seat are finalized by the charge.refunded webhook.
    return json({ ok: true, refunded: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
