-- PGFinders listing separation and server-enforced admin writes.
-- Apply this migration to the Supabase project configured by the mobile app before release.

begin;

alter table public.properties
  add column if not exists listing_kind text not null default 'legacy';

alter table public.properties
  drop constraint if exists properties_listing_kind_check;

alter table public.properties
  add constraint properties_listing_kind_check
  check (listing_kind in ('legacy', 'pg'));

create or replace function public.is_pgfinders_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users as app_user
    where app_user.clerk_id = (select auth.jwt() ->> 'sub')
      and app_user.is_admin is true
  );
$$;

revoke all on function public.is_pgfinders_admin() from public;
grant execute on function public.is_pgfinders_admin() to anon, authenticated;

alter table public.properties enable row level security;

-- Listings are intended to be publicly discoverable. The restrictive write policies
-- below still apply even if an older permissive write policy exists.
drop policy if exists pgfinders_properties_public_read on public.properties;
create policy pgfinders_properties_public_read
  on public.properties
  for select
  to anon, authenticated
  using (true);

drop policy if exists pgfinders_properties_admin_insert on public.properties;
create policy pgfinders_properties_admin_insert
  on public.properties
  as restrictive
  for insert
  to anon, authenticated
  with check (public.is_pgfinders_admin());

drop policy if exists pgfinders_properties_admin_update on public.properties;
create policy pgfinders_properties_admin_update
  on public.properties
  as restrictive
  for update
  to anon, authenticated
  using (public.is_pgfinders_admin())
  with check (public.is_pgfinders_admin());

drop policy if exists pgfinders_properties_admin_delete on public.properties;
create policy pgfinders_properties_admin_delete
  on public.properties
  as restrictive
  for delete
  to anon, authenticated
  using (public.is_pgfinders_admin());

-- Images are read through public URLs by the app. The uploader places each object
-- under <Clerk user id>/..., and only an authenticated app admin may mutate this bucket.
update storage.buckets
set public = true
where id = 'property-images';

drop policy if exists pgfinders_property_images_admin_insert on storage.objects;
create policy pgfinders_property_images_admin_insert
  on storage.objects
  as restrictive
  for insert
  to anon, authenticated
  with check (
    bucket_id <> 'property-images'
    or (
      public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    )
  );

drop policy if exists pgfinders_property_images_admin_update on storage.objects;
create policy pgfinders_property_images_admin_update
  on storage.objects
  as restrictive
  for update
  to anon, authenticated
  using (
    bucket_id <> 'property-images'
    or (
      public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    )
  )
  with check (
    bucket_id <> 'property-images'
    or (
      public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    )
  );

drop policy if exists pgfinders_property_images_admin_delete on storage.objects;
create policy pgfinders_property_images_admin_delete
  on storage.objects
  as restrictive
  for delete
  to anon, authenticated
  using (
    bucket_id <> 'property-images'
    or (
      public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    )
  );

commit;
