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

## 2. Run the schema

1. Open your project in the Supabase dashboard.
2. Go to **SQL Editor → New query**.
3. Paste the entire contents of [`schema.sql`](./schema.sql).
4. Click **Run**.

The script is idempotent — running it again is safe. It creates:

- Enums for roles, belts, rulesets, formats, statuses, etc.
- The six tables: `profiles`, `sessions`, `bookings`,
  `coach_verification_requests`, `training_history`, `payments`.
- A trigger that creates a `profiles` row automatically when a user signs up
  (reading `full_name` and `role` from the sign-up metadata).
- Row-Level Security policies for every table, plus an `is_admin()` helper.

## 3. Auth settings (optional, recommended for local dev)

In **Authentication → Providers → Email**, turn **off** "Confirm email" while
developing so sign-ups log in immediately. Re-enable it for production.

## 4. Make yourself an admin (optional)

After signing up once, promote your account in the SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## Regenerating types

`src/lib/database.types.ts` is hand-written to match `schema.sql`. With the
Supabase CLI you can regenerate it:

```
supabase gen types typescript --project-id <project-id> > src/lib/database.types.ts
```
