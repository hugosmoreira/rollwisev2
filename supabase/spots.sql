-- =====================================================================
-- RollWise — keep sessions.spots_remaining in sync with bookings.
-- Run in the Supabase SQL editor. Idempotent.
--
-- A seat is consumed by an ACTIVE booking = paid AND not cancelled. To prevent
-- overbooking, the seat is CLAIMED ATOMICALLY by the stripe-webhook (via
-- claim_session_spot) BEFORE the booking is inserted — so this trigger does
-- NOT decrement on insert (that would double-count). It only:
--   * +1 when an active booking leaves active (cancel / refund / delete)
--   * -1 if a cancelled booking is reactivated (rare; admin)
-- =====================================================================

create or replace function public.sync_session_spots()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  was_active boolean := false;
  now_active boolean := false;
begin
  if tg_op = 'UPDATE' or tg_op = 'DELETE' then
    was_active := old.payment_status = 'paid' and old.status <> 'cancelled';
  end if;
  if tg_op = 'UPDATE' then
    now_active := new.payment_status = 'paid' and new.status <> 'cancelled';
  end if;
  -- INSERT intentionally does nothing here (the webhook claims atomically).

  if now_active and not was_active then
    update public.sessions
      set spots_remaining = greatest(0, spots_remaining - 1)
      where id = new.session_id;
  elsif was_active and not now_active then
    update public.sessions
      set spots_remaining = spots_remaining + 1
      where id = old.session_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_sync_spots on public.bookings;
create trigger bookings_sync_spots
  after insert or update or delete on public.bookings
  for each row execute function public.sync_session_spots();

-- Atomically take a seat; returns false if none remain (caller refunds).
create or replace function public.claim_session_spot(p_session_id uuid)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare claimed boolean;
begin
  update public.sessions
    set spots_remaining = spots_remaining - 1
    where id = p_session_id and spots_remaining > 0
    returning true into claimed;
  return coalesce(claimed, false);
end;
$$;

-- Give a previously-claimed seat back (failed insert / dup delivery).
create or replace function public.release_session_spot(p_session_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  update public.sessions
    set spots_remaining = spots_remaining + 1
    where id = p_session_id;
end;
$$;

-- These mutate capacity, so lock them to the server (webhook service-role) only.
revoke all on function public.claim_session_spot(uuid) from public;
revoke all on function public.release_session_spot(uuid) from public;
grant execute on function public.claim_session_spot(uuid) to service_role;
grant execute on function public.release_session_spot(uuid) to service_role;

-- One-time backfill: recompute spots from current ACTIVE (paid, non-cancelled)
-- bookings. Safe to re-run.
update public.sessions s
  set spots_remaining = greatest(0, s.capacity - (
    select count(*) from public.bookings b
    where b.session_id = s.id
      and b.payment_status = 'paid'
      and b.status <> 'cancelled'
  ));
