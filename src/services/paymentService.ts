/* =================================================================
   RollWise — Payment service  (Supabase `payments` + Stripe via Edge Functions)
   -----------------------------------------------------------------
   Checkout + Connect run in Supabase Edge Functions that hold the
   Stripe SECRET key server-side. The browser only ever invokes those
   functions and reads the `payments` table.
   ================================================================= */

import type { Payment, PaymentStatus } from '@/types';
import { getSupabase } from '@/lib/supabase';
import { rowToPayment } from './mappers';
import { functionError } from './serviceError';

export interface PaymentFilters {
  coachId?: string;
  status?: PaymentStatus;
}

export interface CoachEarnings {
  totalEarned: number;
  thisMonth: number;
  pendingPayout: number;
  paidSessions: number;
}

export interface PlatformPayments {
  grossVolume: number;
  platformFees: number;
  coachPayouts: number;
  refunds: number;
}

export interface RedirectUrl {
  url: string;
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export const paymentService = {
  /** Payment records, optionally filtered. */
  async listPayments(filters: PaymentFilters = {}): Promise<Payment[]> {
    let q = getSupabase()
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    if (filters.coachId) q = q.eq('coach_id', filters.coachId);
    if (filters.status) q = q.eq('status', filters.status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(rowToPayment);
  },

  /** A coach's earnings summary — amounts are NET of the platform fee. */
  async getCoachEarnings(coachId: string): Promise<CoachEarnings> {
    const { data, error } = await getSupabase()
      .from('payments')
      .select('amount, application_fee, status, type, created_at')
      .eq('coach_id', coachId);
    if (error) throw error;
    const paid = (data ?? []).filter((p) => p.status === 'paid' && p.type === 'charge');
    const net = (p: { amount: number; application_fee: number }) =>
      Number(p.amount) - Number(p.application_fee ?? 0);
    const totalEarned = paid.reduce((s, p) => s + net(p), 0);
    const thisMonth = paid
      .filter((p) => isThisMonth(p.created_at))
      .reduce((s, p) => s + net(p), 0);
    return {
      totalEarned: Math.round(totalEarned * 100) / 100,
      thisMonth: Math.round(thisMonth * 100) / 100,
      // Destination charges pay out to the coach automatically via Stripe, so
      // nothing is held pending in-app.
      pendingPayout: 0,
      paidSessions: paid.length,
    };
  },

  /** Platform-wide payment totals (admin) — fees are the real stored amounts. */
  async getPlatformPayments(): Promise<PlatformPayments> {
    const { data, error } = await getSupabase()
      .from('payments')
      .select('amount, application_fee, status, type');
    if (error) throw error;
    const rows = data ?? [];
    const charges = rows.filter((p) => p.status === 'paid' && p.type === 'charge');
    const grossVolume = charges.reduce((s, p) => s + Number(p.amount), 0);
    const platformFees = charges.reduce(
      (s, p) => s + Number(p.application_fee ?? 0),
      0,
    );
    const refunds = rows
      .filter((p) => p.type === 'refund')
      .reduce((s, p) => s + Number(p.amount), 0);
    return {
      grossVolume: Math.round(grossVolume * 100) / 100,
      platformFees: Math.round(platformFees * 100) / 100,
      coachPayouts: Math.round((grossVolume - platformFees) * 100) / 100,
      refunds: Math.round(refunds * 100) / 100,
    };
  },

  /** Coach payout history. */
  async listPayouts(coachId: string): Promise<Payment[]> {
    const { data, error } = await getSupabase()
      .from('payments')
      .select('*')
      .eq('coach_id', coachId)
      .eq('type', 'payout')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToPayment);
  },

  /** Start a Stripe Checkout for a session; returns a redirect URL. */
  async createCheckoutSession(sessionId: string): Promise<RedirectUrl> {
    const { data, error } = await getSupabase().functions.invoke<{
      url?: string;
      error?: string;
    }>('create-checkout', { body: { sessionId } });
    if (error) throw new Error(await functionError(error));
    if (!data?.url) throw new Error(data?.error ?? 'Could not start checkout.');
    return { url: data.url };
  },

  /** Start Stripe Connect onboarding for the signed-in coach. */
  async createStripeConnectLink(): Promise<RedirectUrl> {
    const { data, error } = await getSupabase().functions.invoke<{
      url?: string;
      error?: string;
    }>('stripe-connect', { body: {} });
    if (error) throw new Error(await functionError(error));
    if (!data?.url) throw new Error(data?.error ?? 'Could not start onboarding.');
    return { url: data.url };
  },

  /**
   * A coach's Stripe payout status. `connected` = an Express account exists;
   * `ready` = onboarding is complete and the account can receive payouts.
   */
  async getStripeConnectStatus(
    coachId: string,
  ): Promise<{ connected: boolean; ready: boolean }> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .select('stripe_account_id, stripe_charges_enabled')
      .eq('id', coachId)
      .maybeSingle();
    if (!error) {
      return {
        connected: Boolean(data?.stripe_account_id),
        ready: Boolean(data?.stripe_charges_enabled),
      };
    }
    // Fallback if the stripe_charges_enabled column isn't there yet (migration
    // pending) — still report whether an account exists.
    const { data: legacy } = await sb
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', coachId)
      .maybeSingle();
    return { connected: Boolean(legacy?.stripe_account_id), ready: false };
  },
};
