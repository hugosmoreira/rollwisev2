-- =====================================================================
-- RollWise — per-session timezone (run in the Supabase SQL editor). Idempotent.
-- Stores the IANA timezone (e.g. 'America/Los_Angeles') the coach was in when
-- they created the session, so the session time can be shown/emailed in the
-- coach's intended wall-clock time instead of UTC or each viewer's local zone.
-- =====================================================================

alter table public.sessions
  add column if not exists timezone text not null default 'UTC';
