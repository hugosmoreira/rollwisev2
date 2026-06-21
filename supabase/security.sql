-- =====================================================================
-- RollWise — RLS privilege-escalation fixes (run in the Supabase SQL editor).
-- Idempotent. Fixes two critical holes found in the pre-launch audit:
--   1) A user could self-edit privileged PROFILE columns — verification,
--      account status, ratings, and Stripe payout flags (only `role` was
--      locked by hardening.sql).
--   2) A student could set their own BOOKING to payment_status='paid' /
--      status='confirmed' (on insert OR update) and grab a seat without paying.
--
-- Approach: BEFORE-trigger guards that reset privileged columns for
-- authenticated non-admin END-USERS (auth.uid() IS NOT NULL and not admin).
-- The Edge Functions use the service-role key (auth.uid() IS NULL) and are
-- trusted, as are admins. Legit user flows still work: profile edits, a coach
-- REQUESTING verification (verification -> 'pending'), and cancellations.
-- =====================================================================

-- 1) PROFILES — lock privileged columns (supersedes the role-only lock).
create or replace function public.lock_profile_privileged_columns()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role                   := old.role;
    new.status                 := old.status;
    new.rating_average         := old.rating_average;
    new.rating_count           := old.rating_count;
    new.stripe_account_id      := old.stripe_account_id;
    new.stripe_charges_enabled := old.stripe_charges_enabled;
    -- A coach may REQUEST review (set 'pending'); they can never self-verify.
    if new.verification is distinct from old.verification
       and new.verification <> 'pending' then
      new.verification := old.verification;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_role on public.profiles;
drop trigger if exists profiles_lock_privileged on public.profiles;
create trigger profiles_lock_privileged
  before update on public.profiles
  for each row execute function public.lock_profile_privileged_columns();

-- 2) BOOKINGS — end-users can never set payment/confirmation themselves.
--    On INSERT a user-created row is forced to unpaid/pending (harmless: takes
--    no seat, since spots only count paid). On UPDATE they may only cancel.
create or replace function public.lock_booking_privileged_columns()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.payment_status := 'unpaid';
      new.status := 'pending';
    elsif tg_op = 'UPDATE' then
      new.payment_status := old.payment_status;
      if new.status is distinct from old.status and new.status <> 'cancelled' then
        new.status := old.status;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_lock_privileged on public.bookings;
create trigger bookings_lock_privileged
  before insert or update on public.bookings
  for each row execute function public.lock_booking_privileged_columns();
