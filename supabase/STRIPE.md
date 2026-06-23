# RollWise — Stripe payments & payouts setup

Payments and coach payouts run in **Supabase Edge Functions** so the Stripe
**secret key never touches the frontend**. The browser invokes the functions; the
functions talk to Stripe.

The functions:
- `create-checkout` — validates the session (published, not in the past, not full,
  and the coach is **payout-ready**) and creates a Stripe **Checkout Session as a
  destination charge**: the coach's share is routed to their connected account and
  the platform keeps a fee. **No booking is created here.**
- `stripe-webhook` — on `checkout.session.completed` (web Checkout) **and
  `payment_intent.succeeded`** (mobile PaymentSheet), **atomically claims a seat**,
  creates the confirmed/paid booking, records the payment, and emails the student
  (if the session filled up first, the student is refunded). It also handles
  `account.updated` (coach onboarding status) and `charge.refunded` (cancels the
  booking and frees the seat). **Co-maintained with the mobile app — see the
  shared-backend note below.**
- `create-payment-intent` — **mobile only** (native Stripe PaymentSheet). Creates a
  destination-charge PaymentIntent and returns its client secret; the booking is
  created later by the `payment_intent.succeeded` webhook. (Lives in the mobile
  repo; listed here so the shared webhook's event set makes sense.)
- `stripe-connect` — onboards a coach's Stripe **Express** account for payouts.
- `cancel-booking` — cancels a booking for one of its participants. A **paid**
  booking is **refunded through Stripe** (the `charge.refunded` webhook then frees
  the seat); unpaid/pending bookings are cancelled directly. The database blocks
  participants from cancelling a paid row directly, so this is the only path.
- `cancel-session` — the coach-side analogue, run when a **coach (or admin)
  cancels a whole session**. It authorizes the caller, **refunds every active
  paid booking** on the session through Stripe (each `charge.refunded` webhook
  then cancels that booking and frees its seat), cancels unpaid/pending bookings,
  and only then marks the session cancelled. If any refund fails, the session is
  left active so a cancelled session never strands a paid student. The database
  blocks a coach from flipping a session with paid bookings to `cancelled`
  directly, so this is the only path.

> **Shared backend — web and mobile use the same Supabase project + Stripe
> account. Ownership split:** the **mobile repo** owns and deploys
> `stripe-webhook`, `cancel-booking`, `cancel-session`, `create-payment-intent`,
> and `_shared/`. The **web repo (rollwisev2)** owns the database migrations,
> `create-checkout`, and `stripe-connect`. The copies of the mobile-owned
> functions in this repo are **reference only — do not deploy them from here.**
> The deployed `stripe-webhook` handles both `checkout.session.completed` (web)
> and `payment_intent.succeeded` (mobile); the live webhook must subscribe to both.

## 0. One-time: database

Apply the database migrations in [`supabase/migrations/`](./migrations) — see the
[Supabase README](./README.md) (`supabase db push`, or run them in filename order
in the SQL editor). The payment-related ones are `…_stripe.sql` and `…_spots.sql`.

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
# Web repo (rollwisev2) owns and deploys ONLY these two:
supabase functions deploy create-checkout
supabase functions deploy stripe-connect
```

`stripe-webhook`, `cancel-booking`, `cancel-session`, and `create-payment-intent`
(plus `_shared/`) are **deployed from the mobile repo** (see the shared-backend
note above). Do **not** deploy them from rollwisev2 — the copies here are
reference only, and the web `stripe-webhook` copy lacks the mobile
`payment_intent.succeeded` handler.

## 4. Create the Stripe webhook

Stripe dashboard → **Developers → Webhooks → Add endpoint**:

- **Endpoint URL:** `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
- **Events:** `checkout.session.completed`, **`payment_intent.succeeded`** (required
  for mobile PaymentSheet bookings), `account.updated`, `charge.refunded`

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

> **Mobile onboarding:** the app calls `stripe-connect` with
> `{ returnUrl: "rollwise://stripe/connected", refreshUrl: "rollwise://stripe/refresh" }`
> and opens the link with `WebBrowser.openAuthSessionAsync(...)` so onboarding
> returns into the app. This requires the **deployed** `stripe-connect` to be the
> updated version (it reads those URLs and sets `business_type=individual` +
> a product description so Stripe doesn't demand a business website). Deploy it
> before testing mobile coach onboarding.

## 6. Test it

1. Onboard a coach (above), then publish a session as that coach.
2. As a student, open the class → **Book & Pay** → pay with test card
   `4242 4242 4242 4242` (any future expiry, any CVC/ZIP).
3. You return to **My Bookings** showing **Confirmed / Paid**; the session's spots
   drop by one; the coach's **Earnings** shows the **net** amount (after your fee);
   and admin **Payments** updates.
4. To test refunds: either **cancel the paid booking in the app** (calls
   `cancel-booking`, which refunds via Stripe) or refund the payment in the Stripe
   dashboard. Either way the `charge.refunded` webhook flips the booking to
   **Cancelled / Refunded** and frees the seat.
5. To test a **coach cancelling a whole session** with paid students: as the
   coach, cancel the session (calls `cancel-session`). Every paid booking is
   refunded via Stripe, each `charge.refunded` webhook flips that booking to
   **Cancelled / Refunded**, the session shows **Cancelled**, and each student's
   **My Bookings** reflects the refund.

## Notes

- Keep Stripe in **test mode** while developing. At launch, switch to **live**
  keys, create a **live-mode** webhook endpoint, and have coaches re-onboard.
- With destination charges, Stripe's processing fee comes out of the platform's
  share, so your net is a little below the headline `PLATFORM_FEE_PERCENT`.
