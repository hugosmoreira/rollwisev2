-- =====================================================================
-- RollWise — harden the public read views (Advisor "Security Definer View").
-- Idempotent. Run in the Supabase SQL editor (or `supabase db push`).
--
-- CONTEXT (read before changing):
-- `public_profiles` and `member_profiles` are DELIBERATELY security-definer
-- views (security_invoker = off). The base `profiles` table is RLS-locked to
-- self+admin, so these curated views are the ONLY public read path and they
-- expose a SAFE column subset — never `email`, `stripe_account_id`, or
-- `stripe_charges_enabled`. That is why no PII is reachable through them even
-- though they bypass the base-table RLS.
--
-- Supabase's linter flags EVERY security-definer view regardless of whether it
-- is safe, so it will still list these two. They are reviewed and intentional;
-- dismiss them in the Advisor as "curated view, no PII exposed" (the chosen
-- approach). The genuine hardening this migration adds:
--
--   1) `security_barrier = true` on both views — stops a low-cost / leaky
--      function in a caller-supplied WHERE clause from being pushed down and
--      probing rows the view's own filter is meant to hide.
--   2) `security_invoker = false` made EXPLICIT — documents intent so a future
--      `create or replace` copy doesn't silently flip the trust model.
--   3) Re-asserts the exact safe column lists, the active-coach filter, and the
--      least-privilege grants, so running THIS file alone guarantees the safe
--      end state regardless of which earlier migrations ran.
--
-- Column shapes are UNCHANGED from 20260622120600 / 20260622120900, so this is
-- transparent to the web AND mobile clients that read these views.
-- =====================================================================

-- 0) Belt-and-suspenders: the base table must stay locked to self + admin so
--    the views remain the only public read path. (Defined in 20260622120600;
--    re-asserted here, idempotent.)
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- 1) Public coach discovery — anon + authenticated. ACTIVE COACHES ONLY.
--    Safe columns only (no email / stripe ids).
create or replace view public.public_profiles
  with (security_barrier = true, security_invoker = false) as
  select
    id, role, full_name, avatar_url, city, bio,
    belt, belt_degree, academy, lineage, hourly_rate,
    rulesets, focus_tags, rating_average, rating_count,
    verification, status, social_links, created_at
  from public.profiles
  where role = 'coach' and status = 'active';

grant select on public.public_profiles to anon, authenticated;

-- 2) Participant name/avatar lookup — AUTHENTICATED ONLY, all roles, minimal
--    display fields. Never granted to anon (so it can't enumerate the user base).
create or replace view public.member_profiles
  with (security_barrier = true, security_invoker = false) as
  select id, role, full_name, avatar_url
  from public.profiles;

revoke all on public.member_profiles from anon;
grant select on public.member_profiles to authenticated;
