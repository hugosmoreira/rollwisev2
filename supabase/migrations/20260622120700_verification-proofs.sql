-- =====================================================================
-- RollWise — private storage for coach verification documents.
-- Run in the Supabase SQL editor. Idempotent.
--
-- Belt certificates / federation records are sensitive, so this bucket is
-- PRIVATE (no public URLs — access is via short-lived signed URLs). A coach
-- can only touch their own folder (<user_id>/...); admins can read all to
-- review. Signed URLs are created only by someone who passes these policies.
-- =====================================================================

-- The bucket itself enforces a size cap and an allow-list of MIME types
-- SERVER-SIDE (Storage API), so the UI checks in VerificationPage are no longer
-- the only gate — a coach calling the storage API directly still can't store an
-- oversized file or, e.g., text/html or image/svg+xml (which could carry script).
-- NOTE: this validates the *declared* content-type; the client also content-sniffs
-- and serves proofs as downloads (Content-Disposition: attachment) so a spoofed
-- type can't render inline in the admin's browser. For byte-level guarantees,
-- route uploads through an Edge Function that checks magic bytes server-side.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verification-proofs', 'verification-proofs', false,
  8388608,  -- 8 MiB, matches the UI limit
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = false,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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
