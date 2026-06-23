-- =====================================================================
-- RollWise — RLS privilege-escalation fixes (run in the Supabase SQL editor).
-- Idempotent. Fixes three critical holes found in the pre-launch audit:
--   1) A user could self-edit privileged PROFILE columns — verification,
--      account status, ratings, and Stripe payout flags (only `role` was
--      locked by hardening.sql).
--   2) A student could set their own BOOKING to payment_status='paid' /
--      status='confirmed' (on insert OR update) and grab a seat without paying.
--   3) A coach could flip a SESSION to 'cancelled' while it still had PAID
--      bookings — stranding students who paid for a session that no longer
--      happens, with no Stripe refund and a stale seat count.
--
-- Approach: BEFORE-trigger guards that reset privileged columns for
-- authenticated non-admin END-USERS (auth.uid() IS NOT NULL and not admin).
-- The Edge Functions use the service-role key (auth.uid() IS NULL) and are
-- trusted, as are admins. Legit user flows still work: profile edits, a coach
-- REQUESTING verification (verification -> 'pending'), cancelling an UNPAID
-- booking, and editing/cancelling a session with no paid bookings. Cancelling a
-- PAID booking is refused here and routed through the `cancel-booking` Edge
-- Function; cancelling a session that still has paid bookings is refused here
-- and routed through the `cancel-session` Edge Function — both so they always
-- coordinate a Stripe refund before the seat is freed.
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

-- 2) BOOKINGS — end-users can never set payment/confirmation themselves, can
--    never rebind a booking to another session/student/coach, and cannot cancel
--    a PAID row directly (that must go through the refund flow).
--    On INSERT a user-created row is forced to unpaid/pending (harmless: takes
--    no seat, since spots only count paid). On UPDATE we use an ALLOWLIST: every
--    relationship/accounting column is frozen to the stored row, and the only
--    state change a participant may make is status -> 'cancelled' on an UNPAID
--    booking. Paid cancellations are refused here and handled by the
--    `cancel-booking` Edge Function (Stripe refund -> charge.refunded webhook
--    cancels the row with the service role), so a paid seat is never freed
--    without the money moving. Service-role (auth.uid() null) and admins bypass
--    all of this.
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
      -- Freeze identity / payment / accounting columns: a participant cannot
      -- move a paid seat to a different session, student, or coach, nor touch
      -- payment state, the Stripe link, or the created timestamp.
      new.session_id        := old.session_id;
      new.student_id        := old.student_id;
      new.coach_id          := old.coach_id;
      new.stripe_session_id := old.stripe_session_id;
      new.payment_status    := old.payment_status;
      new.created_at        := old.created_at;

      if new.status is distinct from old.status then
        if new.status <> 'cancelled' then
          new.status := old.status;            -- only cancellation is allowed
        elsif old.payment_status = 'paid' then
          raise exception
            'Paid bookings must be cancelled through the refund flow'
            using errcode = 'check_violation';
        end if;
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

-- 3) SESSIONS — only an ACTIVE COACH may create or publish a session.
--    The base `sessions_insert`/`sessions_update` policies checked only
--    `coach_id = auth.uid()`, so ANY authenticated account (e.g. a student) could
--    insert a `published` session under its own id via the Supabase API and have
--    it appear in public discovery. The client route-guards are not a security
--    boundary. Require the caller's profile to be role='coach' and status='active'.
--    (Note: this does NOT require verification — payment capture is already gated
--    on Stripe payout-readiness in create-checkout. Add `and verification =
--    'verified'` below if you also want to gate listing on belt verification.)
create or replace function public.is_active_coach()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coach' and status = 'active'
  );
$$;

drop policy if exists sessions_insert on public.sessions;
create policy sessions_insert on public.sessions for insert
  with check (coach_id = auth.uid() and public.is_active_coach());

drop policy if exists sessions_update on public.sessions;
create policy sessions_update on public.sessions for update
  using (coach_id = auth.uid() and public.is_active_coach())
  with check (coach_id = auth.uid() and public.is_active_coach());

-- 4) SESSIONS cancellation — an end-user (a coach, or anyone) may not directly
--    flip a session to 'cancelled' while it still has PAID, non-cancelled
--    bookings: that would strand students who paid for a session that no longer
--    happens (no refund, stale seat count). Such cancellations must go through
--    the `cancel-session` Edge Function, which refunds every paid booking via
--    Stripe (the charge.refunded webhook then cancels each booking and frees its
--    seat) before marking the session cancelled with the service role. This
--    mirrors how a PAID booking cancellation is blocked in (2) above.
--    Service-role (auth.uid() null) and admins bypass this; all other session
--    edits (title, time, draft <-> publish, etc.) are unaffected.
create or replace function public.lock_session_paid_cancellation()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin()
     and new.status = 'cancelled'
     and old.status is distinct from 'cancelled'
     and exists (
       select 1 from public.bookings b
       where b.session_id = old.id
         and b.payment_status = 'paid'
         and b.status <> 'cancelled'
     ) then
    raise exception
      'Sessions with paid bookings must be cancelled through the refund flow'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists sessions_lock_paid_cancellation on public.sessions;
create trigger sessions_lock_paid_cancellation
  before update on public.sessions
  for each row execute function public.lock_session_paid_cancellation();
