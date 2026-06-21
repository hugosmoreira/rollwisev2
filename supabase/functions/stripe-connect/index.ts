// stripe-connect — creates (or reuses) a coach's Stripe Express account and
// returns an onboarding link. The coach is identified from their JWT.
//
// Deploy: supabase functions deploy stripe-connect
// Secrets needed: STRIPE_SECRET_KEY, APP_URL

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

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Not authenticated' }, 401);

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
      });
      accountId = account.id;
      await admin
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/app/coach/earnings?stripe=refresh`,
      return_url: `${appUrl}/app/coach/earnings?stripe=connected`,
      type: 'account_onboarding',
    });

    return json({ url: link.url });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
