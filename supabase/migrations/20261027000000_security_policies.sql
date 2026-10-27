-- PGFinders security hardening for the current Clerk + Supabase schema.
-- Apply with Supabase CLI (supabase db push) only after checking the target project.
-- Clerk's Supabase third-party integration places the Clerk user ID in auth.jwt()->>'sub'.

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Additive PG-rental fields. Existing sale-oriented rows are deliberately not
-- migrated into monthly rent: price is not a reliable rent value.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS monthly_rent numeric(12,2)
    CHECK (monthly_rent IS NULL OR monthly_rent >= 0),
  ADD COLUMN IF NOT EXISTS security_deposit numeric(12,2)
    CHECK (security_deposit IS NULL OR security_deposit >= 0),
  ADD COLUMN IF NOT EXISTS room_type text NOT NULL DEFAULT 'private_room'
    CHECK (room_type IN ('single_room', 'shared_room', 'private_room', 'entire_pg')),
  ADD COLUMN IF NOT EXISTS gender_preference text NOT NULL DEFAULT 'any'
    CHECK (gender_preference IN ('any', 'male', 'female')),
  ADD COLUMN IF NOT EXISTS food_included boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_from date;

CREATE INDEX IF NOT EXISTS properties_available_pg_rent_idx
  ON public.properties (monthly_rent)
  WHERE is_sold IS FALSE AND monthly_rent IS NOT NULL;

-- Remove the current broad/public-role policies shown in the dashboard screenshot.
DROP POLICY IF EXISTS "Properties are publicly readable" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can insert saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can read own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
DROP POLICY IF EXISTS "Users can read own row" ON public.users;
DROP POLICY IF EXISTS "Users can update own row" ON public.users;

-- Public listing discovery: read-only for anonymous and signed-in users.
CREATE POLICY "Properties are publicly readable"
  ON public.properties
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- All listing writes are authorized by the database, not by the client-side store.
-- A user must have a matching users row with is_admin=true for these policies to pass.
CREATE POLICY "Only PGFinders admins can create properties"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  );

CREATE POLICY "Only PGFinders admins can update properties"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  );

CREATE POLICY "Only PGFinders admins can delete properties"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  );

-- Saved listings are private to the Clerk user who owns the row.
CREATE POLICY "Users can read own saved properties"
  ON public.saved_properties
  FOR SELECT
  TO authenticated
  USING (user_clerk_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can insert own saved properties"
  ON public.saved_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (user_clerk_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can update own saved properties"
  ON public.saved_properties
  FOR UPDATE
  TO authenticated
  USING (user_clerk_id = (SELECT auth.jwt()->>'sub'))
  WITH CHECK (user_clerk_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can delete own saved properties"
  ON public.saved_properties
  FOR DELETE
  TO authenticated
  USING (user_clerk_id = (SELECT auth.jwt()->>'sub'));

-- Users may create/read/update their own profile, but never assign or change is_admin.
CREATE POLICY "Users can insert own row"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can read own row"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (clerk_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can update own row"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (clerk_id = (SELECT auth.jwt()->>'sub'))
  WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

CREATE OR REPLACE FUNCTION public.block_client_admin_flag_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Allow administrative SQL/service-role operations. Supabase client requests
  -- authenticated as a user or anonymous session cannot self-promote.
  IF auth.role() IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' AND COALESCE(NEW.is_admin, false) IS TRUE THEN
      RAISE EXCEPTION 'is_admin can only be assigned by a trusted administrator'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'is_admin can only be changed by a trusted administrator'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.block_client_admin_flag_changes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS block_client_admin_flag_changes ON public.users;
CREATE TRIGGER block_client_admin_flag_changes
  BEFORE INSERT OR UPDATE OF is_admin
  ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.block_client_admin_flag_changes();

-- Listing photos are public content, but uploads/updates/deletes are admin-only.
-- The restrictive policies also prevent a broad pre-existing storage policy from
-- granting unauthorised writes to this bucket.
UPDATE storage.buckets
SET public = true
WHERE id = 'property-images';

DROP POLICY IF EXISTS "PGFinders property images are public" ON storage.objects;
DROP POLICY IF EXISTS "PGFinders admins upload property images" ON storage.objects;
DROP POLICY IF EXISTS "PGFinders admins update property images" ON storage.objects;
DROP POLICY IF EXISTS "PGFinders admins delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Restrict property image inserts to admins" ON storage.objects;
DROP POLICY IF EXISTS "Restrict property image updates to admins" ON storage.objects;
DROP POLICY IF EXISTS "Restrict property image deletes to admins" ON storage.objects;

CREATE POLICY "PGFinders property images are public"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'property-images');

CREATE POLICY "PGFinders admins upload property images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  );

CREATE POLICY "PGFinders admins update property images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  )
  WITH CHECK (
    bucket_id = 'property-images'
    AND EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  );

CREATE POLICY "PGFinders admins delete property images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  );

CREATE POLICY "Restrict property image inserts to admins"
  ON storage.objects
  AS RESTRICTIVE
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id <> 'property-images'
    OR EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  );

CREATE POLICY "Restrict property image updates to admins"
  ON storage.objects
  AS RESTRICTIVE
  FOR UPDATE
  TO public
  USING (
    bucket_id <> 'property-images'
    OR EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  )
  WITH CHECK (
    bucket_id <> 'property-images'
    OR EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  );

CREATE POLICY "Restrict property image deletes to admins"
  ON storage.objects
  AS RESTRICTIVE
  FOR DELETE
  TO public
  USING (
    bucket_id <> 'property-images'
    OR EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  );

-- Ensure PostgREST roles can reach tables; row policies above remain authoritative.
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_properties TO authenticated;
