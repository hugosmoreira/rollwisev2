-- =====================================================================
-- RollWise — stop leaking email/PII from `profiles` (run in SQL editor).
-- Idempotent.
--
-- Before: `profiles_select` was `using (true)` — anyone with the public anon
-- key could read EVERY user's email and PII. Now the base table is readable
-- only by its owner and admins. Public coach discovery and the display
-- names/avatars the app needs are served by email-free VIEWS instead.
--
-- The views run with the owner's rights (security_invoker = off, the default),
-- so they bypass the base-table RLS and return the safe columns to anyone
-- granted SELECT — but they never expose email or the Stripe payout ids.
--
-- Two views, least privilege:
--   * public_profiles — readable by anon (public coach discovery + coach
--     name/avatar lookups). NOTE: this migration still defines it over ALL roles
--     so currently-installed clients that resolve participant names from it keep
--     working. It is narrowed to active coaches by the LATER, consumer-breaking
--     migration `20260622120900_restrict-public-profiles.sql` — apply that one
--     only after every shipped client (web + mobile) reads participant names
--     from member_profiles.
--   * member_profiles — minimal display fields (name/avatar) for ALL roles,
--     readable by AUTHENTICATED users only. Used to resolve a participant's name
--     when you already share a booking/session with them (e.g. a coach seeing a
--     student's name). Never granted to anon, so it can't enumerate the user base.
-- =====================================================================

-- 1) Lock the base table down to self + admin.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- 2) Public discovery + name/avatar lookups. ALL roles for now (see header);
--    narrowed to active coaches by 20260622120900_restrict-public-profiles.sql.
create or replace view public.public_profiles as
  select
    id, role, full_name, avatar_url, city, bio,
    belt, belt_degree, academy, lineage, hourly_rate,
    rulesets, focus_tags, rating_average, rating_count,
    verification, status, social_links, created_at
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- 3) Authenticated-only participant lookup view — minimal display fields for all
--    roles (so a coach can resolve their students' names, a student their coach).
--    NOT granted to anon: an anonymous client cannot enumerate non-coach users.
--    This is the additive half of the split — safe to apply at any time.
create or replace view public.member_profiles as
  select id, role, full_name, avatar_url
  from public.profiles;

revoke all on public.member_profiles from anon;
grant select on public.member_profiles to authenticated;
