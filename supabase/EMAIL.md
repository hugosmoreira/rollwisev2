# RollWise — booking confirmation emails (Resend)

When a student pays, the `stripe-webhook` function creates the booking and then
sends the student a confirmation email via [Resend](https://resend.com). It's
**best-effort**: if Resend is down or `RESEND_API_KEY` is unset, the booking
still succeeds — the email is just skipped.

## 1. Create a Resend account + API key

1. Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/mo, 100/day).
2. **API Keys → Create API Key** → copy it (starts with `re_…`).

## 2. Choose a sending address

- **Production (recommended):** **Domains → Add Domain**, add the DNS records
  Resend shows, wait for "Verified". Then you can send from e.g.
  `bookings@yourdomain.com`.
- **Quick test (no domain):** use `onboarding@resend.dev` as the from address.
  ⚠️ Resend only **delivers** test emails to the address you signed up with, so
  to see it land, temporarily set a student profile's email to your own.

## 3. Set the Supabase secrets

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set EMAIL_FROM="RollWise <bookings@yourdomain.com>"   # or "RollWise <onboarding@resend.dev>"
supabase secrets set APP_URL=http://localhost:5173        # already set if you did Stripe
supabase secrets set APP_TIMEZONE=America/Los_Angeles      # optional; default 'UTC' (formats the session time in the email)
```

## 4. Redeploy the webhook

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

## 5. Test

Book a session and pay with test card `4242 4242 4242 4242`. The student whose
account email you can reach should receive a "You're booked" email with the
session voucher details. Check **Resend → Logs** to see delivery status.

## Notes
- `EMAIL_FROM` must use a verified domain to deliver to arbitrary recipients.
- The email never blocks payment — failures are logged in the function logs and
  the booking is still created.
- Adding a "new booking" email to the **coach** later is a one-liner using the
  same `sendBookingConfirmation` helper in `supabase/functions/_shared/email.ts`.
