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

-- The original form constrained type to sale-property categories. Extend it for PGs.
alter table public.properties
  drop constraint if exists properties_type_check;
alter table public.properties
  drop constraint if exists pgfinders_properties_type_check;
alter table public.properties
  add constraint pgfinders_properties_type_check
  check (
    type is null
    or type in (
      'apartment', 'house', 'villa', 'studio',
      'single_room', 'double_sharing', 'triple_sharing', 'private_room', 'hostel'
    )
  );

-- PG-specific terms, distinct from a one-time property sale price.
alter table public.properties
  add column if not exists deposit_amount numeric(12, 2);
alter table public.properties
  add column if not exists food_available boolean;
alter table public.properties
  add column if not exists gender_preference text not null default 'any';
alter table public.properties
  add column if not exists amenities text[] not null default '{}'::text[];
alter table public.properties
  add column if not exists house_rules text not null default '';
alter table public.properties
  add column if not exists owner_whatsapp text;

alter table public.properties
  drop constraint if exists pgfinders_properties_owner_whatsapp;
alter table public.properties
  add constraint pgfinders_properties_owner_whatsapp
  check (
    owner_whatsapp is null
    or (
      length(owner_whatsapp) between 10 and 15
      and owner_whatsapp !~ '[^0-9]'
    )
  );

alter table public.properties
  drop constraint if exists pgfinders_properties_deposit_nonnegative;
alter table public.properties
  add constraint pgfinders_properties_deposit_nonnegative
  check (deposit_amount is null or deposit_amount >= 0);

alter table public.properties
  drop constraint if exists pgfinders_properties_gender_preference;
alter table public.properties
  add constraint pgfinders_properties_gender_preference
  check (gender_preference in ('any', 'male', 'female'));

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

-- App user rows are self-readable for Clerk-to-Supabase admin-state sync. Mobile
-- clients cannot grant themselves admin, edit their authorization flag, or delete
-- account rows. User provisioning stays limited to the signed-in Clerk subject.
alter table public.users enable row level security;

drop policy if exists pgfinders_users_read_self on public.users;
create policy pgfinders_users_read_self
  on public.users
  for select
  to authenticated
  using (clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_users_insert_self on public.users;
create policy pgfinders_users_insert_self
  on public.users
  for insert
  to authenticated
  with check (
    clerk_id = (select auth.jwt() ->> 'sub')
    and coalesce(is_admin, false) is false
  );

drop policy if exists pgfinders_users_read_self_restrict on public.users;
create policy pgfinders_users_read_self_restrict
  on public.users
  as restrictive
  for select
  to anon, authenticated
  using (clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_users_insert_self_restrict on public.users;
create policy pgfinders_users_insert_self_restrict
  on public.users
  as restrictive
  for insert
  to anon, authenticated
  with check (
    clerk_id = (select auth.jwt() ->> 'sub')
    and coalesce(is_admin, false) is false
  );

drop policy if exists pgfinders_users_update_deny on public.users;
create policy pgfinders_users_update_deny
  on public.users
  as restrictive
  for update
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists pgfinders_users_delete_deny on public.users;
create policy pgfinders_users_delete_deny
  on public.users
  as restrictive
  for delete
  to anon, authenticated
  using (false);

-- Listings are intended to be publicly discoverable. The restrictive write policies
-- below still apply even if an older permissive write policy exists.
drop policy if exists pgfinders_properties_public_read on public.properties;
create policy pgfinders_properties_public_read
  on public.properties
  for select
  to anon, authenticated
  using (true);

-- Provide explicit permissive policies for administrators. The restrictive policies
-- below act as a second, mandatory gate even if an older permissive policy is broad.
drop policy if exists pgfinders_properties_admin_insert_allow on public.properties;
create policy pgfinders_properties_admin_insert_allow
  on public.properties
  for insert
  to authenticated
  with check (public.is_pgfinders_admin());

drop policy if exists pgfinders_properties_admin_update_allow on public.properties;
create policy pgfinders_properties_admin_update_allow
  on public.properties
  for update
  to authenticated
  using (public.is_pgfinders_admin())
  with check (public.is_pgfinders_admin());

drop policy if exists pgfinders_properties_admin_delete_allow on public.properties;
create policy pgfinders_properties_admin_delete_allow
  on public.properties
  for delete
  to authenticated
  using (public.is_pgfinders_admin());

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

-- Saved properties are private per-Clerk-user data. Restrictive policies prevent
-- broad legacy permissive policies from exposing one user's shortlist to another.
alter table public.saved_properties enable row level security;

drop policy if exists pgfinders_saved_properties_select_self on public.saved_properties;
create policy pgfinders_saved_properties_select_self
  on public.saved_properties
  for select
  to authenticated
  using (user_clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_saved_properties_insert_self on public.saved_properties;
create policy pgfinders_saved_properties_insert_self
  on public.saved_properties
  for insert
  to authenticated
  with check (
    user_clerk_id = (select auth.jwt() ->> 'sub')
    and exists (
      select 1
      from public.properties
      where properties.id = saved_properties.property_id
        and properties.listing_kind = 'pg'
        and properties.is_sold is false
    )
  );

drop policy if exists pgfinders_saved_properties_delete_self on public.saved_properties;
create policy pgfinders_saved_properties_delete_self
  on public.saved_properties
  for delete
  to authenticated
  using (user_clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_saved_properties_select_self_restrict on public.saved_properties;
create policy pgfinders_saved_properties_select_self_restrict
  on public.saved_properties
  as restrictive
  for select
  to anon, authenticated
  using (user_clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_saved_properties_insert_self_restrict on public.saved_properties;
create policy pgfinders_saved_properties_insert_self_restrict
  on public.saved_properties
  as restrictive
  for insert
  to anon, authenticated
  with check (
    user_clerk_id = (select auth.jwt() ->> 'sub')
    and exists (
      select 1
      from public.properties
      where properties.id = saved_properties.property_id
        and properties.listing_kind = 'pg'
        and properties.is_sold is false
    )
  );

drop policy if exists pgfinders_saved_properties_update_deny on public.saved_properties;
create policy pgfinders_saved_properties_update_deny
  on public.saved_properties
  as restrictive
  for update
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists pgfinders_saved_properties_delete_self_restrict on public.saved_properties;
create policy pgfinders_saved_properties_delete_self_restrict
  on public.saved_properties
  as restrictive
  for delete
  to anon, authenticated
  using (user_clerk_id = (select auth.jwt() ->> 'sub'));

-- Images are read through public URLs by the app. The uploader places each object
-- under <Clerk user id>/..., and only an authenticated app admin may mutate this bucket.
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists pgfinders_property_images_admin_insert_allow on storage.objects;
create policy pgfinders_property_images_admin_insert_allow
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id <> 'property-images'
    or (
      public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    )
  );

drop policy if exists pgfinders_property_images_admin_update_allow on storage.objects;
create policy pgfinders_property_images_admin_update_allow
  on storage.objects
  for update
  to authenticated
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

drop policy if exists pgfinders_property_images_admin_delete_allow on storage.objects;
create policy pgfinders_property_images_admin_delete_allow
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id <> 'property-images'
    or (
      public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    )
  );

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
);


alter table public.properties
  drop constraint if exists pgfinders_properties_deposit_nonnegative;
alter table public.properties
  add constraint pgfinders_properties_deposit_nonnegative
  check (deposit_amount is null or deposit_amount >= 0);

alter table public.properties
  drop constraint if exists pgfinders_properties_gender_preference;
alter table public.properties
  add constraint pgfinders_properties_gender_preference
  check (gender_preference in ('any', 'male', 'female'));

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

-- App user rows are self-readable for Clerk-to-Supabase admin-state sync. Mobile
-- clients cannot grant themselves admin, edit their authorization flag, or delete
-- account rows. User provisioning stays limited to the signed-in Clerk subject.
alter table public.users enable row level security;

drop policy if exists pgfinders_users_read_self on public.users;
create policy pgfinders_users_read_self
  on public.users
  for select
  to authenticated
  using (clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_users_insert_self on public.users;
create policy pgfinders_users_insert_self
  on public.users
  for insert
  to authenticated
  with check (
    clerk_id = (select auth.jwt() ->> 'sub')
    and coalesce(is_admin, false) is false
  );

drop policy if exists pgfinders_users_read_self_restrict on public.users;
create policy pgfinders_users_read_self_restrict
  on public.users
  as restrictive
  for select
  to anon, authenticated
  using (clerk_id = (select auth.jwt() ->> 'sub'));

drop policy if exists pgfinders_users_insert_self_restrict on public.users;
create policy pgfinders_users_insert_self_restrict
  on public.users
  as restrictive
  for insert
  to anon, authenticated
  with check (
    clerk_id = (select auth.jwt() ->> 'sub')
    and coalesce(is_admin, false) is false
  );

drop policy if exists pgfinders_users_update_deny on public.users;
create policy pgfinders_users_update_deny
  on public.users
  as restrictive
  for update
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists pgfinders_users_delete_deny on public.users;
create policy pgfinders_users_delete_deny
  on public.users
  as restrictive
  for delete
  to anon, authenticated
  using (false);

-- Listings are intended to be publicly discoverable. The restrictive write policies
-- below still apply even if an older permissive write policy exists.
drop policy if exists pgfinders_properties_public_read on public.properties;
create policy pgfinders_properties_public_read
  on public.properties
  for select
  to anon, authenticated
  using (true);

-- Provide explicit permissive policies for administrators. The restrictive policies
-- below act as a second, mandatory gate even if an older permissive policy is broad.
drop policy if exists pgfinders_properties_admin_insert_allow on public.properties;
create policy pgfinders_properties_admin_insert_allow
  on public.properties
  for insert
  to authenticated
  with check (public.is_pgfinders_admin());

drop policy if exists pgfinders_properties_admin_update_allow on public.properties;
create policy pgfinders_properties_admin_update_allow
  on public.properties
  for update
  to authenticated
  using (public.is_pgfinders_admin())
  with check (public.is_pgfinders_admin());

drop policy if exists pgfinders_properties_admin_delete_allow on public.properties;
create policy pgfinders_properties_admin_delete_allow
  on public.properties
  for delete
  to authenticated
  using (public.is_pgfinders_admin());

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

drop policy if exists pgfinders_property_images_admin_insert_allow on storage.objects;
create policy pgfinders_property_images_admin_insert_allow
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id <> 'property-images'
    or (
      public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    )
  );

drop policy if exists pgfinders_property_images_admin_update_allow on storage.objects;
create policy pgfinders_property_images_admin_update_allow
  on storage.objects
  for update
  to authenticated
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

drop policy if exists pgfinders_property_images_admin_delete_allow on storage.objects;
create policy pgfinders_property_images_admin_delete_allow
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id <> 'property-images'
    or (
      public.is_pgfinders_admin()
      and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
    )
  );

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
