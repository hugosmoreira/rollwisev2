-- =====================================================================
-- RollWise — Stripe columns (run in the Supabase SQL editor)
-- ---------------------------------------------------------------------
-- Adds the few columns the Stripe Edge Functions need. Idempotent.
-- Payments are written by the webhook using the service-role key, which
-- bypasses RLS, so no extra payment write policy is required.
-- =====================================================================

-- A coach's connected Stripe (Express) account for payouts.
alter table public.profiles
  add column if not exists stripe_account_id text;

-- Whether that connected account has completed onboarding and can receive
-- charges/payouts. Maintained by the stripe-webhook `account.updated` handler.
alter table public.profiles
  add column if not exists stripe_charges_enabled boolean not null default false;

-- Link a booking to its Stripe Checkout session (optional, for reconciliation).
alter table public.bookings
  add column if not exists stripe_session_id text;

-- Stripe Checkout/PaymentIntent id on a payment row (optional).
alter table public.payments
  add column if not exists stripe_payment_id text;

-- Platform fee (in dollars) taken on a charge — used for net coach earnings
-- and real admin platform totals (instead of a hardcoded %).
alter table public.payments
  add column if not exists application_fee numeric(10,2) not null default 0;

-- Idempotency: at most one booking per Stripe Checkout session, so a duplicate
-- webhook delivery can't create a second booking. Partial — free bookings have
-- no stripe_session_id.
create unique index if not exists bookings_stripe_session_id_key
  on public.bookings (stripe_session_id)
  where stripe_session_id is not null;
