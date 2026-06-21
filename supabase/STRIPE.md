# RollWise — Stripe payments setup

Payments use **Supabase Edge Functions** so the Stripe **secret key never touches
the frontend**. The browser invokes the functions; the functions talk to Stripe.

What you'll deploy:
- `create-checkout` — creates a booking + a Stripe Checkout Session (student pays).
- `stripe-webhook` — Stripe calls this on payment; it marks the booking paid and
  records the payment.
- `stripe-connect` — onboards a coach's Stripe account for payouts.

## 0. One-time: DB columns

In the Supabase SQL editor, run **[stripe.sql](./stripe.sql)** (adds
`profiles.stripe_account_id`, `bookings.stripe_session_id`,
`payments.stripe_payment_id`).

## 1. Install + link the Supabase CLI

```bash
npm i -g supabase            # or: scoop install supabase / brew install supabase
supabase login
supabase link --project-ref ikwwcacirwpkdyjwfqei
```

## 2. Set the function secrets (server-side only)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically. You only set these:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set APP_URL=http://localhost:5173
# STRIPE_WEBHOOK_SECRET comes in step 4 (after you create the webhook):
# supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

> The secret key goes **here**, never in `.env.local`.

## 3. Deploy the functions

```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-connect
# The webhook has no Supabase JWT (Stripe calls it directly):
supabase functions deploy stripe-webhook --no-verify-jwt
```

If your CLI rejects `--no-verify-jwt`, add this to `supabase/config.toml` instead
and deploy normally:

```toml
[functions.stripe-webhook]
verify_jwt = false
```

## 4. Create the Stripe webhook

In the Stripe dashboard → **Developers → Webhooks → Add endpoint**:

- **Endpoint URL:**
  `https://ikwwcacirwpkdyjwfqei.supabase.co/functions/v1/stripe-webhook`
- **Events:** `checkout.session.completed`

Copy the endpoint's **Signing secret** (`whsec_…`) and set it:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase functions deploy stripe-webhook --no-verify-jwt   # redeploy to pick it up
```

(For local testing you can instead run `stripe listen --forward-to
https://ikwwcacirwpkdyjwfqei.supabase.co/functions/v1/stripe-webhook`.)

## 5. Test it

1. As a student, open a class and click **Book & Pay** → you're redirected to
   Stripe Checkout.
2. Pay with the test card **`4242 4242 4242 4242`**, any future expiry, any CVC/ZIP.
3. You're returned to **My Bookings** with a success banner; the booking shows
   **Confirmed / Paid**, and the coach's **Earnings** + admin **Payments** update.

## Notes
- Keep Stripe in **test mode** while developing.
- Coach payouts (Connect) require completing Stripe's onboarding form; in test
  mode you can use the prefilled test data.
- The platform-fee figure on the admin Payments page is a notional 10% for the
  demo — wire real application fees via Stripe when you go live.
```
