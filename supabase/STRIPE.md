# RollWise — Stripe payments & payouts setup

Payments and coach payouts run in **Supabase Edge Functions** so the Stripe
**secret key never touches the frontend**. The browser invokes the functions; the
functions talk to Stripe.

The functions:
- `create-checkout` — validates the session (published, not in the past, not full,
  and the coach is **payout-ready**) and creates a Stripe **Checkout Session as a
  destination charge**: the coach's share is routed to their connected account and
  the platform keeps a fee. **No booking is created here.**
- `stripe-webhook` — on `checkout.session.completed`, **atomically claims a seat**,
  creates the confirmed/paid booking, records the payment, and emails the student
  (if the session filled up first, the student is refunded). It also handles
  `account.updated` (coach onboarding status) and `charge.refunded` (cancels the
  booking and frees the seat).
- `stripe-connect` — onboards a coach's Stripe **Express** account for payouts.

## 0. One-time: database

Run the SQL files in the Supabase SQL editor (see the project README for the full
ordered list). The payment-related ones are `stripe.sql` and `spots.sql`.

## 1. Install + link the Supabase CLI

```bash
npm i -g supabase            # or: scoop install supabase / brew install supabase
supabase login
supabase link --project-ref <your-project-ref>
```

## 2. Set the function secrets (server-side only)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically. You set these:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set APP_URL=http://localhost:5173
supabase secrets set PLATFORM_FEE_PERCENT=20      # your take rate (%)
# STRIPE_WEBHOOK_SECRET comes in step 4 (after you create the webhook endpoint).
```

> Secret keys go **here**, never in `.env.local`.

## 3. Deploy the functions

```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-connect
# The webhook has no Supabase JWT (Stripe calls it directly):
supabase functions deploy stripe-webhook --no-verify-jwt
```

## 4. Create the Stripe webhook

Stripe dashboard → **Developers → Webhooks → Add endpoint**:

- **Endpoint URL:** `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
- **Events:** `checkout.session.completed`, `account.updated`, `charge.refunded`

Copy the endpoint's **Signing secret** (`whsec_…`) and set it, then redeploy:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase functions deploy stripe-webhook --no-verify-jwt
```

## 5. Coach payouts (Stripe Connect)

A coach connects from **Earnings → Connect Stripe** (which calls `stripe-connect`).
They must finish Stripe's onboarding before students can book them — in test mode
you can use the prefilled test data. When onboarding completes, the
`account.updated` webhook marks them payout-ready.

## 6. Test it

1. Onboard a coach (above), then publish a session as that coach.
2. As a student, open the class → **Book & Pay** → pay with test card
   `4242 4242 4242 4242` (any future expiry, any CVC/ZIP).
3. You return to **My Bookings** showing **Confirmed / Paid**; the session's spots
   drop by one; the coach's **Earnings** shows the **net** amount (after your fee);
   and admin **Payments** updates.
4. To test refunds: refund the payment in the Stripe dashboard → the booking flips
   to **Cancelled / Refunded** and the seat is freed.

## Notes

- Keep Stripe in **test mode** while developing. At launch, switch to **live**
  keys, create a **live-mode** webhook endpoint, and have coaches re-onboard.
- With destination charges, Stripe's processing fee comes out of the platform's
  share, so your net is a little below the headline `PLATFORM_FEE_PERCENT`.
