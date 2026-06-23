-- =====================================================================
-- RollWise — Supabase schema
-- ---------------------------------------------------------------------
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query
-- → paste → Run). It is idempotent: safe to run more than once.
--
-- Creates: enums, the 6 tables (profiles, sessions, bookings,
-- coach_verification_requests, training_history, payments), an auto
-- profile-creation trigger on sign-up, and Row-Level Security policies.
-- =====================================================================

-- ---------- Enums ----------
do $$ begin create type user_role          as enum ('student','coach','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type belt_rank          as enum ('white','blue','purple','brown','black'); exception when duplicate_object then null; end $$;
do $$ begin create type ruleset            as enum ('gi','no-gi','both'); exception when duplicate_object then null; end $$;
do $$ begin create type session_format     as enum ('private','group'); exception when duplicate_object then null; end $$;
do $$ begin create type skill_level        as enum ('beginner','intermediate','advanced','all-levels'); exception when duplicate_object then null; end $$;
do $$ begin create type session_status     as enum ('draft','published','cancelled','completed'); exception when duplicate_object then null; end $$;
do $$ begin create type booking_status     as enum ('pending','confirmed','completed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_status     as enum ('unpaid','pending','paid','refunded'); exception when duplicate_object then null; end $$;
do $$ begin create type verification_status as enum ('unverified','pending','verified','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type account_status     as enum ('active','suspended'); exception when duplicate_object then null; end $$;

-- ---------- Tables ----------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           user_role not null default 'student',
  full_name      text not null default '',
  email          text not null default '',
  avatar_url     text,
  city           text,
  bio            text,
  belt           belt_rank,
  belt_degree    int check (belt_degree between 0 and 10),
  academy        text,
  lineage        text,
  hourly_rate    numeric(10,2),
  rulesets       text[] not null default '{}',
  focus_tags     text[] not null default '{}',
  rating_average numeric(2,1) not null default 0,
  rating_count   int not null default 0,
  verification   verification_status not null default 'unverified',
  status         account_status not null default 'active',
  social_links   jsonb not null default '[]',
  created_at     timestamptz not null default now()
);

create table if not exists public.sessions (
  id               uuid primary key default gen_random_uuid(),
  coach_id         uuid not null references public.profiles(id) on delete cascade,
  title            text not null,
  description      text,
  format           session_format not null,
  ruleset          ruleset not null,
  skill_level      skill_level not null default 'all-levels',
  focus_tags       text[] not null default '{}',
  starts_at        timestamptz not null,
  duration_minutes int not null check (duration_minutes > 0),
  price            numeric(10,2) not null check (price >= 0),
  capacity         int not null check (capacity > 0),
  spots_remaining  int not null default 0,
  gym_name         text,
  city             text not null default '',
  status           session_status not null default 'draft',
  created_at       timestamptz not null default now()
);
create index if not exists sessions_coach_idx  on public.sessions(coach_id);
create index if not exists sessions_status_idx on public.sessions(status);

create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.sessions(id) on delete cascade,
  student_id     uuid not null references public.profiles(id) on delete cascade,
  coach_id       uuid not null references public.profiles(id) on delete cascade,
  status         booking_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  created_at     timestamptz not null default now()
);
create index if not exists bookings_student_idx on public.bookings(student_id);
create index if not exists bookings_coach_idx   on public.bookings(coach_id);

create table if not exists public.coach_verification_requests (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid not null references public.profiles(id) on delete cascade,
  belt         belt_rank not null,
  belt_degree  int,
  academy      text not null,
  lineage      text,
  social_links jsonb not null default '[]',
  proof_url    text,
  status       verification_status not null default 'pending',
  reason       text,
  submitted_at timestamptz not null default now()
);
create index if not exists cvr_coach_idx  on public.coach_verification_requests(coach_id);
create index if not exists cvr_status_idx on public.coach_verification_requests(status);

create table if not exists public.training_history (
  id               uuid primary key default gen_random_uuid(),
  booking_id       uuid not null references public.bookings(id) on delete cascade,
  student_id       uuid not null references public.profiles(id) on delete cascade,
  coach_id         uuid not null references public.profiles(id) on delete cascade,
  completed_at     timestamptz not null default now(),
  duration_minutes int not null default 0,
  focus_tags       text[] not null default '{}',
  coach_notes      text,
  created_at       timestamptz not null default now()
);
create index if not exists th_student_idx on public.training_history(student_id);
create index if not exists th_coach_idx   on public.training_history(coach_id);

create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  amount     numeric(10,2) not null,
  currency   text not null default 'USD',
  status     payment_status not null default 'pending',
  type       text not null default 'charge' check (type in ('charge','payout','refund')),
  created_at timestamptz not null default now()
);
create index if not exists payments_coach_idx on public.payments(coach_id);

-- ---------- Helper: is the current user an admin? ----------
create or replace function public.is_admin()
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Auto-create a profile row when a user signs up ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'role','')::user_role, 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row-Level Security ----------
alter table public.profiles                    enable row level security;
alter table public.sessions                    enable row level security;
alter table public.bookings                    enable row level security;
alter table public.coach_verification_requests enable row level security;
alter table public.training_history            enable row level security;
alter table public.payments                    enable row level security;

-- profiles --------------------------------------------------------------
-- NOTE: public read enables coach discovery and the landing page. This
-- exposes profile columns (incl. email) to anon; for production, restrict
-- this to a curated public view instead.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- sessions --------------------------------------------------------------
drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select
  using (status = 'published' or coach_id = auth.uid() or public.is_admin());

drop policy if exists sessions_insert on public.sessions;
create policy sessions_insert on public.sessions for insert with check (coach_id = auth.uid());

drop policy if exists sessions_update on public.sessions;
create policy sessions_update on public.sessions for update
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

drop policy if exists sessions_delete on public.sessions;
create policy sessions_delete on public.sessions for delete using (coach_id = auth.uid());

-- bookings --------------------------------------------------------------
drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings for select
  using (student_id = auth.uid() or coach_id = auth.uid() or public.is_admin());

drop policy if exists bookings_insert on public.bookings;
create policy bookings_insert on public.bookings for insert with check (student_id = auth.uid());

drop policy if exists bookings_update on public.bookings;
create policy bookings_update on public.bookings for update
  using (student_id = auth.uid() or coach_id = auth.uid());

-- coach_verification_requests ------------------------------------------
drop policy if exists cvr_select on public.coach_verification_requests;
create policy cvr_select on public.coach_verification_requests for select
  using (coach_id = auth.uid() or public.is_admin());

drop policy if exists cvr_insert on public.coach_verification_requests;
create policy cvr_insert on public.coach_verification_requests for insert with check (coach_id = auth.uid());

drop policy if exists cvr_update on public.coach_verification_requests;
create policy cvr_update on public.coach_verification_requests for update using (public.is_admin());

-- training_history ------------------------------------------------------
drop policy if exists th_select on public.training_history;
create policy th_select on public.training_history for select
  using (student_id = auth.uid() or coach_id = auth.uid() or public.is_admin());

drop policy if exists th_insert on public.training_history;
create policy th_insert on public.training_history for insert with check (coach_id = auth.uid());

drop policy if exists th_update on public.training_history;
create policy th_update on public.training_history for update using (coach_id = auth.uid());

-- payments (writes happen server-side via Stripe webhooks / service role) -
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select
  using (coach_id = auth.uid() or public.is_admin());

-- ---------- Grants (RLS still governs row access) ----------
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;

-- Done.
