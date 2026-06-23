# RollWise

**RollWise is a marketplace for private Brazilian Jiu-Jitsu coaching.** Students
discover verified coaches and book private or small-group sessions; coaches publish
sessions, manage their schedule and bookings, get verified, and receive payouts;
admins moderate the platform. Scope is private & small-group training only — no
seminars.

The app has three role-based experiences (student, coach, admin) on top of a
Supabase backend, with real payments and payouts handled through Stripe.

## Features

### Students
- Browse and search verified coaches and published sessions (filter by ruleset,
  format, skill level, and technique)
- Book and pay for sessions securely via Stripe Checkout
- Manage bookings, view training history, and edit a profile (with avatar upload)

### Coaches
- Publish and manage private / small-group sessions, with a schedule calendar
- Apply for verification (belt rank, academy, lineage, and a proof document)
- Review bookings and students
- Connect a Stripe account to receive **automatic payouts** (the platform keeps a
  configurable fee; the coach receives the rest)
- Earnings dashboard showing net-of-fee revenue

### Admins
- Platform dashboard with live metrics
- Review and approve/reject coach verification requests (including the proof file)
- Manage users (suspend / reinstate) and view all sessions, bookings, and payments

## Tech stack

- **Frontend:** Vite + React + TypeScript, React Router, CSS Modules + design
  tokens, lucide-react icons. Dark theme first, with a light theme + toggle.
- **Backend:** Supabase — Postgres with Row-Level Security, Auth, and Storage.
- **Payments:** Stripe Checkout + Stripe Connect (destination charges with an
  application fee), driven by Supabase Edge Functions so secret keys never reach
  the browser.
- **Email:** Resend for transactional booking confirmations (also via an Edge
  Function).

## Getting started

### 1. Install and run the frontend

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run preview  # preview the production build
```

### 2. Environment

Copy `.env.example` to `.env.local` and fill in your values:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...      # optional
```

Only the anon / publishable keys belong in the frontend. Secret keys (Stripe
secret, webhook signing secret, Resend key, the Supabase service-role key) are
**Supabase Edge Function secrets** and must never be committed.

### 3. Database

The schema and all RLS/security hardening live in ordered, idempotent migrations
under [`supabase/migrations/`](supabase/migrations). Apply them with the Supabase
CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

…or paste each migration into the **SQL editor** in filename order (the numeric
prefix is the order). See [`supabase/README.md`](supabase/README.md) for what each
migration does and notes for an already-provisioned database.

### 4. Edge Functions, Stripe, and email

See [`supabase/STRIPE.md`](supabase/STRIPE.md) and
[`supabase/EMAIL.md`](supabase/EMAIL.md) for full instructions. In summary:

- Deploy the functions: `create-checkout`, `stripe-connect`, `cancel-booking`,
  `cancel-session`, and `stripe-webhook` (the webhook with `--no-verify-jwt`).
- Set the function secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `APP_URL`, `PLATFORM_FEE_PERCENT`, and (for email) `RESEND_API_KEY`,
  `EMAIL_FROM`, `APP_TIMEZONE`.
- Register a Stripe webhook endpoint for the events
  `checkout.session.completed`, `payment_intent.succeeded` (mobile PaymentSheet),
  `account.updated`, and `charge.refunded`.

## How payments work

1. A student clicks **Book & Pay**. `create-checkout` verifies the session (and
   that the coach can receive payouts) and creates a Stripe Checkout Session — a
   **destination charge** that routes the coach's share to their connected account
   and keeps the platform fee. No booking is created yet.
2. On a completed payment, `stripe-webhook` **atomically claims a seat**, creates
   the confirmed/paid booking, records the payment, and emails the student a
   confirmation. If the session filled up in the meantime, the student is refunded.
3. Refunds (from the Stripe dashboard) are reconciled by the webhook: the booking
   is cancelled and the seat is freed.

## Project structure

```
src/
  components/   reusable UI, layout, and domain cards
  pages/        public, auth, student, coach, and admin screens
  services/     Supabase-backed data services (auth, sessions, bookings, …)
  lib/          Supabase client, auth context, routes, formatters, theme
  styles/       design tokens + dark/light themes
  types/        domain model types
supabase/
  migrations/   ordered SQL: base schema + RLS/security hardening
  functions/    Edge Functions: create-checkout, stripe-webhook, stripe-connect,
                cancel-booking, cancel-session
```

## Project principles

- No mock authentication, demo login, or role-by-email logic.
- No localStorage "database" and no fake seeded data — real empty/loading states.
- Only the Supabase anon/public key ever reaches the frontend.
- Sensitive operations (payments, payouts, refunds, capacity) run server-side in
  Edge Functions and are enforced by Row-Level Security.
