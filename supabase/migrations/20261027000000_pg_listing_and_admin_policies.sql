-- PGFinders listing separation and server-enforced access policies.
-- Review and apply to the Supabase project configured by the app before release.
begin;

alter table public.properties
  add column if not exists listing_kind text not null default 'legacy',
  add column if not exists owner_whatsapp text,
  add column if not exists deposit_amount numeric(12, 2),
  add column if not exists food_available boolean,
  add column if not exists gender_preference text not null default 'any',
  add column if not exists amenities text[] not null default '{}'::text[],
  add column if not exists house_rules text not null default '';

alter table public.properties
  drop constraint if exists properties_listing_kind_check,
  drop constraint if exists properties_type_check,
  drop constraint if exists pgfinders_properties_type_check,
  drop constraint if exists pgfinders_properties_owner_whatsapp,
  drop constraint if exists pgfinders_properties_deposit_nonnegative,
  drop constraint if exists pgfinders_properties_gender_preference;

alter table public.properties
  add constraint properties_listing_kind_check
    check (listing_kind in ('legacy', 'pg')),
  add constraint pgfinders_properties_type_check
    check (
      listing_kind = 'legacy'
      or type in ('single_room', 'double_sharing', 'triple_sharing', 'private_room', 'hostel')
    ),
  add constraint pgfinders_properties_owner_whatsapp
    check (
      owner_whatsapp is null or (
        length(owner_whatsapp) between 10 and 15
        and owner_whatsapp !~ '[^0-9]'
      )
    ),
  add constraint pgfinders_properties_deposit_nonnegative
    check (deposit_amount is null or deposit_amount >= 0),
  add constraint pgfinders_properties_gender_preference
    check (gender_preference in ('any', 'male', 'female'));

create or replace function public.is_pgfinders_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.users as app_user
    where app_user.clerk_id = (select auth.jwt() ->> 'sub')
      and app_user.is_admin is true
  );
$function$;

revoke all on function public.is_pgfinders_admin() from public;
grant execute on function public.is_pgfinders_admin() to anon, authenticated;

-- Users may see/create their own profile row, but mobile clients cannot edit
-- is_admin or mutate another user's profile.
alter table public.users enable row level security;

drop policy if exists pgfinders_users_read_self on public.users;
create policy pgfinders_users_read_self on public.users
  for select to authenticated
  using (clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_users_insert_self on public.users;
create policy pgfinders_users_insert_self on public.users
  for insert to authenticated
  with check (
    clerk_id = (select auth.jwt() ->> 'sub')
    and coalesce(is_admin, false) is false
  );

drop policy if exists pgfinders_users_read_self_restrict on public.users;
create policy pgfinders_users_read_self_restrict on public.users
  as restrictive for select to anon, authenticated
  using (clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_users_insert_self_restrict on public.users;
create policy pgfinders_users_insert_self_restrict on public.users
  as restrictive for insert to anon, authenticated
  with check (
    clerk_id = (select auth.jwt() ->> 'sub')
    and coalesce(is_admin, false) is false
  );

drop policy if exists pgfinders_users_update_deny on public.users;
create policy pgfinders_users_update_deny on public.users
  as restrictive for update to anon, authenticated using (false) with check (false);

drop policy if exists pgfinders_users_delete_deny on public.users;
create policy pgfinders_users_delete_deny on public.users
  as restrictive for delete to anon, authenticated using (false);

-- PG listings are publicly discoverable. Every write is restricted to admins.
alter table public.properties enable row level security;

drop policy if exists pgfinders_properties_public_read on public.properties;
create policy pgfinders_properties_public_read on public.properties
  for select to anon, authenticated using (true);

drop policy if exists pgfinders_properties_admin_insert_allow on public.properties;
create policy pgfinders_properties_admin_insert_allow on public.properties
  for insert to authenticated with check (public.is_pgfinders_admin());

drop policy if exists pgfinders_properties_admin_update_allow on public.properties;
create policy pgfinders_properties_admin_update_allow on public.properties
  for update to authenticated using (public.is_pgfinders_admin())
  with check (public.is_pgfinders_admin());

drop policy if exists pgfinders_properties_admin_delete_allow on public.properties;
create policy pgfinders_properties_admin_delete_allow on public.properties
  for delete to authenticated using (public.is_pgfinders_admin());

drop policy if exists pgfinders_properties_admin_insert_restrict on public.properties;
create policy pgfinders_properties_admin_insert_restrict on public.properties
  as restrictive for insert to anon, authenticated
  with check (public.is_pgfinders_admin());

drop policy if exists pgfinders_properties_admin_update_restrict on public.properties;
create policy pgfinders_properties_admin_update_restrict on public.properties
  as restrictive for update to anon, authenticated
  using (public.is_pgfinders_admin()) with check (public.is_pgfinders_admin());

drop policy if exists pgfinders_properties_admin_delete_restrict on public.properties;
create policy pgfinders_properties_admin_delete_restrict on public.properties
  as restrictive for delete to anon, authenticated
  using (public.is_pgfinders_admin());

-- Saved PG lists are private to the owning Clerk subject.
alter table public.saved_properties enable row level security;

drop policy if exists pgfinders_saved_properties_select_self on public.saved_properties;
create policy pgfinders_saved_properties_select_self on public.saved_properties
  for select to authenticated
  using (user_clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_saved_properties_insert_self on public.saved_properties;
create policy pgfinders_saved_properties_insert_self on public.saved_properties
  for insert to authenticated
  with check (
    user_clerk_id = (select auth.jwt() ->> 'sub')
    and exists (
      select 1 from public.properties
      where public.properties.id = public.saved_properties.property_id
        and public.properties.listing_kind = 'pg'
        and public.properties.is_sold is false
    )
  );

drop policy if exists pgfinders_saved_properties_delete_self on public.saved_properties;
create policy pgfinders_saved_properties_delete_self on public.saved_properties
  for delete to authenticated
  using (user_clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_saved_properties_select_self_restrict on public.saved_properties;
create policy pgfinders_saved_properties_select_self_restrict on public.saved_properties
  as restrictive for select to anon, authenticated
  using (user_clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_saved_properties_insert_self_restrict on public.saved_properties;
create policy pgfinders_saved_properties_insert_self_restrict on public.saved_properties
  as restrictive for insert to anon, authenticated
  with check (
    user_clerk_id = (select auth.jwt() ->> 'sub')
    and exists (
      select 1 from public.properties
      where public.properties.id = public.saved_properties.property_id
        and public.properties.listing_kind = 'pg'
        and public.properties.is_sold is false
    )
  );

drop policy if exists pgfinders_saved_properties_update_deny on public.saved_properties;
create policy pgfinders_saved_properties_update_deny on public.saved_properties
  as restrictive for update to anon, authenticated using (false) with check (false);

drop policy if exists pgfinders_saved_properties_delete_self_restrict on public.saved_properties;
create policy pgfinders_saved_properties_delete_self_restrict on public.saved_properties
  as restrictive for delete to anon, authenticated
  using (user_clerk_id = (select auth.jwt() ->> 'sub'));

-- Public URLs serve images; only authenticated admins can mutate listing images.
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists pgfinders_property_images_insert_allow on storage.objects;
create policy pgfinders_property_images_insert_allow on storage.objects
  for insert to authenticated
  with check (
    bucket_id <> 'property-images'
    or (public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'))
  );

drop policy if exists pgfinders_property_images_update_allow on storage.objects;
create policy pgfinders_property_images_update_allow on storage.objects
  for update to authenticated
  using (
    bucket_id <> 'property-images'
    or (public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'))
  )
  with check (
    bucket_id <> 'property-images'
    or (public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'))
  );

drop policy if exists pgfinders_property_images_delete_allow on storage.objects;
create policy pgfinders_property_images_delete_allow on storage.objects
  for delete to authenticated
  using (
    bucket_id <> 'property-images'
    or (public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'))
  );

drop policy if exists pgfinders_property_images_insert_restrict on storage.objects;
create policy pgfinders_property_images_insert_restrict on storage.objects
  as restrictive for insert to anon, authenticated
  with check (
    bucket_id <> 'property-images'
    or (public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'))
  );

drop policy if exists pgfinders_property_images_update_restrict on storage.objects;
create policy pgfinders_property_images_update_restrict on storage.objects
  as restrictive for update to anon, authenticated
  using (
    bucket_id <> 'property-images'
    or (public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'))
  )
  with check (
    bucket_id <> 'property-images'
    or (public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'))
  );

drop policy if exists pgfinders_property_images_delete_restrict on storage.objects;
create policy pgfinders_property_images_delete_restrict on storage.objects
  as restrictive for delete to anon, authenticated
  using (
    bucket_id <> 'property-images'
    or (public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'))
  );

commit;
