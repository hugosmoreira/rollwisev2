-- =====================================================================
-- RollWise — stop leaking email/PII from `profiles` (run in SQL editor).
-- Idempotent.
--
-- Before: `profiles_select` was `using (true)` — anyone with the public anon
-- key could read EVERY user's email and PII. Now the base table is readable
-- only by its owner and admins. Public coach discovery and the display
-- names/avatars the app needs are served by an email-free VIEW instead.
--
-- The view runs with the owner's rights (security_invoker = off, the default),
-- so it bypasses the base-table RLS and returns the safe columns to anyone
-- granted SELECT — but it never exposes email or the Stripe payout ids.
-- (Trade-off: every user's name/avatar/city/bio is public, like most
--  marketplaces. You can later restrict anon to role='coach' only if desired.)
-- =====================================================================

-- 1) Lock the base table down to self + admin.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- 2) Email-free public view used for discovery and name/avatar lookups.
create or replace view public.public_profiles as
  select
    id, role, full_name, avatar_url, city, bio,
    belt, belt_degree, academy, lineage, hourly_rate,
    rulesets, focus_tags, rating_average, rating_count,
    verification, status, social_links, created_at
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;
