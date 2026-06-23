# RollWise — launch sequence (web + mobile share one backend)

Two apps share **one Supabase project** (`ikwwcacirwpkdyjwfqei`) and **one Stripe
account**.

| Repo | Path | Owns / deploys |
|------|------|----------------|
| **Web** (this repo, `rollwisev2`) → Netlify | `…/RollWise2` | DB migrations, `create-checkout`, `stripe-connect` |
| **Mobile** (Expo/Android) | `…/RollWise Mobile` | `stripe-webhook`, `cancel-booking`, `cancel-session`, `create-payment-intent`, `_shared/` |

> ⚠️ Never deploy the mobile-owned functions from rollwisev2 — the copies here are
> reference only and the web `stripe-webhook` copy lacks the
> `payment_intent.succeeded` handler that creates mobile bookings.

## Rollout order (coordinated — do NOT jump ahead)

1. **Web (you):** deploy the fixed `stripe-connect` + `create-checkout`; apply
   migrations `20260622120400_security`, `20260622120600_public-profiles`,
   `20260622120700_verification-proofs` in the SQL editor (NOT `db push` — see §1).
2. **Ping mobile** → mobile verifies `member_profiles` resolves names, then cuts a
   build (member_profiles read with fallback + stripe-connect deep links + V1 features).
3. **Test the build** end-to-end: coach onboarding (no website wall, clean return
   to the app) + booking + cancellation.
4. **Web (you):** apply `20260622120900_restrict-public-profiles` (closes the
   anonymous-PII finding). Done.

## 1. Database migrations (Supabase SQL editor, in filename order)

> ⚠️ Apply these specific files in the **SQL editor** — do NOT run `supabase db
> push`. The live DB was provisioned by hand (no migration history), so `db push`
> would apply EVERY migration including `…120900` (the breaking restrict) before
> the mobile build ships, blanking student names in the installed app.

Already live: `schema`, `hardening`, `stripe`, `timezone`, `spots`, `avatars`, the
original `public-profiles`, and the #1/#2 booking trigger from `security`.

**Apply now — safe for all clients:**
- [ ] `20260622120400_security.sql` (re-run; adds active-coach publish gate +
  session-cancel trigger — mobile confirmed it routes cancels through the functions)
- [ ] `20260622120600_public-profiles.sql` (adds `member_profiles`; keeps
  `public_profiles` over all roles)
- [ ] `20260622120700_verification-proofs.sql` (bucket size/MIME limits)

**Coordinated — DO NOT apply early:**
- [ ] Tell mobile `…120600` is applied → mobile ships a build reading participant
  names from `member_profiles` → mobile confirms the build is out →
- [ ] `20260622120900_restrict-public-profiles.sql` (narrows `public_profiles` to
  active coaches — this is what closes the anonymous-PII finding)

**Optional, anytime:**
- [ ] `20260622121000_training-history-hardening.sql` (dedup first if it errors)

## 2. Edge Functions
- [ ] Web: `supabase functions deploy create-checkout` and `stripe-connect`
- [ ] Mobile (from the mobile repo): `stripe-webhook` (`--no-verify-jwt`),
  `cancel-booking`, `cancel-session`, `create-payment-intent`

## 3. Go live on Stripe
- [ ] Set `STRIPE_SECRET_KEY` to the **live** key (Supabase secrets)
- [ ] Create a **live** webhook endpoint subscribed to: `checkout.session.completed`,
  `payment_intent.succeeded`, `account.updated`, `charge.refunded`
- [ ] Set `STRIPE_WEBHOOK_SECRET` to the live signing secret → mobile redeploys `stripe-webhook`
- [ ] Coaches **re-onboard** Stripe Connect in live mode (test accounts don't carry over)
- [ ] Set `APP_URL` to the production Netlify URL (checkout redirects + email links)

## 4. Netlify (web)
- [ ] Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_STRIPE_PUBLISHABLE_KEY` (live `pk_…`), then redeploy (Vite bakes them at build)
- [ ] `netlify.toml` already provides the build command + SPA fallback redirect

## 5. Smoke test before inviting users
- [ ] Web: coach onboards → publishes → student books & pays → confirmation email →
  spot decrements → cancel booking → refund + seat frees → deep-link refresh works
- [ ] Mobile: PaymentSheet booking is created (`payment_intent.succeeded`) → cancel in app → refund
- [ ] Both: coach cancels a session with paid students → every student refunded

## Coordination rule
For a DB change that breaks installed clients (e.g. narrowing a view both read),
ship the **additive** part first → let both clients update → apply the breaking
part. Sync via cross-session messages.
