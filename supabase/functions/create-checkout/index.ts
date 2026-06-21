// create-checkout — creates a Stripe Checkout Session for a session booking.
// No booking row is created here; the booking is created only after payment
// succeeds (see stripe-webhook), so abandoned checkouts leave no orphan rows.
// The student is identified from their Supabase JWT; Stripe is called with the
// service-role key (server-side only). Returns { url }.
//
// Deploy: supabase functions deploy create-checkout
// Secrets needed: STRIPE_SECRET_KEY, APP_URL (SUPABASE_URL / *_KEY are built in)

import Stripe from 'npm:stripe@^16.12.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-06-20',
    });
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173';

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

    const { data: session, error } = await admin
      .from('sessions')
      .select('id, title, price, coach_id, status, starts_at, spots_remaining')
      .eq('id', sessionId)
      .single();
    if (error || !session) return json({ error: 'Session not found' }, 404);
    if (session.status !== 'published')
      return json({ error: 'This session is not available to book.' }, 400);
    if (session.coach_id === user.id)
      return json({ error: 'You can’t book your own session.' }, 400);
    if (new Date(session.starts_at).getTime() <= Date.now())
      return json({ error: 'This session has already taken place.' }, 400);
    if ((session.spots_remaining ?? 0) <= 0)
      return json({ error: 'This session is fully booked.' }, 400);

    const amountCents = Math.round(Number(session.price) * 100);

    // The coach MUST have a payout-ready connected account — otherwise we'd
    // capture their money with no way to pay them out. Fail closed: block the
    // booking unless the destination charge can actually be routed to them.
    const { data: coachProfile } = await admin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', session.coach_id)
      .maybeSingle();
    const coachAccount = coachProfile?.stripe_account_id as string | null;
    const coachNotReady = {
      error:
        'This coach isn’t accepting bookings yet — they’re finishing their payment setup. Please check back soon.',
    };
    if (!coachAccount) return json(coachNotReady, 409);

    let chargesEnabled = false;
    try {
      const acct = await stripe.accounts.retrieve(coachAccount);
      chargesEnabled = acct.charges_enabled === true;
    } catch (_e) {
      chargesEnabled = false; // fail closed on any lookup error
    }
    if (!chargesEnabled) return json(coachNotReady, 409);

    const feePct = Number(Deno.env.get('PLATFORM_FEE_PERCENT') ?? '10');
    const paymentIntentData: Record<string, unknown> = {
      application_fee_amount: Math.round((amountCents * feePct) / 100),
      transfer_data: { destination: coachAccount },
    };

    // No booking is created yet — only after payment (see stripe-webhook).
    // Everything needed to create the booking is carried in Checkout metadata.
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: { name: session.title },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/app/student/my-bookings?paid=1`,
      cancel_url: `${appUrl}/app/student/class/${session.id}?canceled=1`,
      metadata: {
        student_id: user.id,
        coach_id: session.coach_id,
        session_id: session.id,
      },
      payment_intent_data: paymentIntentData,
    });

    return json({ url: checkout.url });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
