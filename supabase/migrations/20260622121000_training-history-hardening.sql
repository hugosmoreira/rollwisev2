-- =====================================================================
-- RollWise — training_history integrity hardening.
-- OPTIONAL (flagged by the mobile session). Idempotent. Not required for the
-- initial launch — apply when ready.
--
-- 1) One training_history row per booking (prevents duplicate logs).
--    NOTE: the unique index errors if duplicate booking_id rows already exist.
--    Dedup first if so:
--      delete from public.training_history a
--      using public.training_history b
--      where a.booking_id = b.booking_id and a.ctid < b.ctid;
-- 2) Tighten th_insert: the inserting coach must own the referenced booking AND
--    the student must match that booking's student, so a coach can't forge a
--    history row binding an arbitrary student/booking. (The base policy only
--    checked coach_id = auth.uid().)
-- =====================================================================

create unique index if not exists training_history_booking_id_key
  on public.training_history (booking_id);

drop policy if exists th_insert on public.training_history;
create policy th_insert on public.training_history for insert
  with check (
    coach_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = training_history.booking_id
        and b.coach_id = auth.uid()
        and b.student_id = training_history.student_id
    )
  );
