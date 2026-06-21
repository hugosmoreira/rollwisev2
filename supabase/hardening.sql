-- =====================================================================
-- RollWise — security hardening (run in the Supabase SQL editor)
-- ---------------------------------------------------------------------
-- The base schema lets a signed-in user change their own `role` (and a
-- sign-up could request role='admin' via metadata). That's a privilege-
-- escalation risk. This locks role down so only admins can change roles,
-- and sign-ups can only ever be 'student' or 'coach'.
-- Idempotent: safe to run more than once.
-- =====================================================================

-- 1) Block non-admins from changing a profile's role.
create or replace function public.lock_role_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- Block only authenticated end-users (auth.uid() set) who aren't admins.
  -- SQL-editor / service-role updates (auth.uid() is null) are trusted and allowed.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role := old.role;  -- silently keep the existing role
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_role on public.profiles;
create trigger profiles_lock_role
  before update on public.profiles
  for each row execute function public.lock_role_change();

-- 2) Clamp sign-up role to student/coach (never admin) at account creation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  requested text := new.raw_user_meta_data->>'role';
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    case when requested = 'coach' then 'coach'::user_role else 'student'::user_role end,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- =====================================================================
-- Make an account an admin (admins are promoted here, never self-assigned):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- =====================================================================
