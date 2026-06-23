# RollWise — Supabase

This folder holds the database schema for RollWise.

## 1. Environment

The app reads its connection details from `.env.local` (gitignored) in the
project root:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

Only the **anon/public** key belongs here — it is safe in the browser because
Row-Level Security governs all data access. The **service-role** key must never
be added to this app.

After changing `.env.local`, restart the dev server (`npm run dev`).

## 2. Apply the database migrations

The schema **and** all RLS/security hardening live in ordered, idempotent
migrations under [`migrations/`](./migrations). The numeric filename prefix is the
apply order — later migrations depend on earlier ones (e.g. `…_security.sql`
references the Stripe columns added by `…_stripe.sql`). Apply **all** of them; the
base schema alone is not production-secure (it would leave profile emails
world-readable and omit the privilege/payment-integrity guards).

### Option A — Supabase CLI (recommended)

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

`db push` applies every migration not yet in the project's migration history, in
order.

> **Already provisioned this DB by hand in the SQL editor?** The migrations are
> idempotent, so `supabase db push` is safe to run anyway. To instead mark them as
> already applied without re-running, use
> `supabase migration repair --status applied <version>` for each (the version is
> the numeric prefix, e.g. `20260622120400`).

### Option B — SQL editor

Paste each file from [`migrations/`](./migrations) into **SQL Editor → New query**
and run them **in filename order**. They're idempotent (safe to re-run).

### What each migration does

| Order | Migration | Adds |
|-------|-----------|------|
| 1 | `…_schema.sql` | base tables, enums, `is_admin()`, sign-up trigger, base RLS |
| 2 | `…_hardening.sql` | locks `role`; clamps sign-up role to student/coach |
| 3 | `…_stripe.sql` | Stripe columns on `profiles`/`bookings`/`payments` |
| 4 | `…_timezone.sql` | `sessions.timezone` |
| 5 | `…_security.sql` | profile + booking column locks; active-coach session-publish gate; paid-booking & paid-session cancellation locks |
| 6 | `…_spots.sql` | `spots_remaining` sync + atomic seat claim |
| 7 | `…_public-profiles.sql` | locks `profiles` reads; coach-only public view + authenticated `member_profiles` |
| 8 | `…_verification-proofs.sql` | private bucket (size/MIME limits) + policies for belt proofs |
| 9 | `…_avatars.sql` | public avatar bucket + policies |

### Adding a new change

Create the next migration with `supabase migration new <name>` (or add a file with
a higher numeric prefix), put idempotent SQL in it, and `supabase db push`. Never
edit an already-applied migration — add a new one.

## 3. Auth settings (optional, recommended for local dev)

In **Authentication → Providers → Email**, turn **off** "Confirm email" while
developing so sign-ups log in immediately. Re-enable it for production.

## 4. Make yourself an admin (optional)

After signing up once, promote your account in the SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## Regenerating types

`src/lib/database.types.ts` is hand-written to match the migrations in
[`migrations/`](./migrations). With the Supabase CLI you can regenerate it:

```
supabase gen types typescript --project-id <project-id> > src/lib/database.types.ts
```
