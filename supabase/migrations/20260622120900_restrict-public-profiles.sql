-- =====================================================================
-- RollWise — narrow public_profiles to ACTIVE COACHES (CONSUMER-BREAKING).
-- Idempotent.
--
-- ⚠️ APPLY LAST, and only AFTER every shipped client (web + mobile) resolves
-- participant (student) names from `member_profiles` instead of public_profiles.
-- The web build does this already; coordinate the mobile release before running
-- this. Until then, the public-profiles migration keeps public_profiles over all
-- roles so installed apps don't show blank student names.
--
-- This is the change that actually closes the "anonymous client can enumerate
-- every user's profile" finding: after it, public_profiles exposes only active
-- coaches (the intended public marketplace audience).
-- =====================================================================

create or replace view public.public_profiles as
  select
    id, role, full_name, avatar_url, city, bio,
    belt, belt_degree, academy, lineage, hourly_rate,
    rulesets, focus_tags, rating_average, rating_count,
    verification, status, social_links, created_at
  from public.profiles
  where role = 'coach' and status = 'active';

grant select on public.public_profiles to anon, authenticated;
