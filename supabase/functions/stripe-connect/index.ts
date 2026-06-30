// stripe-connect — creates (or reuses) a coach's Stripe Express account and
// returns an onboarding link. The coach is identified from their JWT.
//
// Optional JSON body: { returnUrl, refreshUrl } — app-originated callers (mobile)
// can pass deep links (rollwise://...) so onboarding returns to the app; web
// callers send no body and get the web Earnings page.
// Mobile calls it as: { returnUrl: "rollwise://stripe/connected",
// refreshUrl: "rollwise://stripe/refresh" }, opened via
// WebBrowser.openAuthSessionAsync(url, "rollwise://stripe/connected") so the
// in-app browser auto-closes on return.
//
// Deploy: supabase functions deploy stripe-connect
// Secrets needed: STRIPE_SECRET_KEY, APP_URL

import Stripe from 'npm:stripe@^16.12.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.45.0';

// CORS: pin browser calls to the app origin (defense-in-depth; the JWT check is
// the real boundary). Falls back to '*' if APP_URL is unset. NOTE: this function
// is shared with the mobile app, but mobile invokes it over native HTTP which
// ignores CORS, so pinning the web origin here is safe for both clients.
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') ?? '*',
  Vary: 'Origin',
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

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Not authenticated' }, 401);

    // Optional body — web sends none; mobile may send deep-link return/refresh URLs.
    let body: { returnUrl?: string; refreshUrl?: string } = {};
    try {
      body = await req.json();
    } catch {
      // no/empty body — fall back to the web defaults below
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_account_id, role, email')
      .eq('id', user.id)
      .single();
    if (!profile || profile.role !== 'coach')
      return json({ error: 'Only coaches can connect Stripe.' }, 403);

    let accountId = profile.stripe_account_id as string | null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: profile.email ?? user.email,
        // Individual is the norm for a coaching marketplace; supplying a product
        // description means Stripe no longer requires the coach to provide a
        // business website during onboarding. (Drop business_type if you need
        // company-type coaches to onboard.)
        business_type: 'individual',
        business_profile: {
          product_description:
            'One-on-one and small-group Brazilian Jiu-Jitsu coaching sessions booked through RollWise.',
        },
      });
      accountId = account.id;
      await admin
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);
    }

    // Mobile-aware return/refresh URLs. Only our own web origin or a rollwise://
    // deep link is accepted, so this can't be turned into an open redirect.
    const allowed = (u: unknown): u is string =>
      typeof u === 'string' && (u.startsWith('rollwise://') || u.startsWith(appUrl));
    const returnUrl = allowed(body.returnUrl)
      ? body.returnUrl
      : `${appUrl}/app/coach/earnings?stripe=connected`;
    const refreshUrl = allowed(body.refreshUrl)
      ? body.refreshUrl
      : `${appUrl}/app/coach/earnings?stripe=refresh`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return json({ url: link.url });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
