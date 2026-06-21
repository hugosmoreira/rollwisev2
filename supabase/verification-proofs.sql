-- =====================================================================
-- RollWise — private storage for coach verification documents.
-- Run in the Supabase SQL editor. Idempotent.
--
-- Belt certificates / federation records are sensitive, so this bucket is
-- PRIVATE (no public URLs — access is via short-lived signed URLs). A coach
-- can only touch their own folder (<user_id>/...); admins can read all to
-- review. Signed URLs are created only by someone who passes these policies.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('verification-proofs', 'verification-proofs', false)
on conflict (id) do update set public = false;

-- A coach manages only files in their own folder.
drop policy if exists "Coaches manage their own proofs" on storage.objects;
create policy "Coaches manage their own proofs"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'verification-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'verification-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read every proof (for the verification review queue).
drop policy if exists "Admins can read all proofs" on storage.objects;
create policy "Admins can read all proofs"
  on storage.objects for select
  to authenticated
  using ( bucket_id = 'verification-proofs' and public.is_admin() );
