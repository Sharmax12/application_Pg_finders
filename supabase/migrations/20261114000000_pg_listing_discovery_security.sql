-- Public browsing only needs active PG listings and the fields used by the app.
-- Keep the same restriction in the database so clients cannot query legacy or
-- unavailable rows by changing the filters in the mobile/web app.

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Properties are publicly readable" ON public.properties;
DROP POLICY IF EXISTS "Active PG listings are publicly readable" ON public.properties;
DROP POLICY IF EXISTS "PGFinders admins can read all listings" ON public.properties;

CREATE POLICY "Active PG listings are publicly readable"
  ON public.properties
  FOR SELECT
  TO anon, authenticated
  USING (is_sold IS FALSE AND monthly_rent IS NOT NULL);

CREATE POLICY "PGFinders admins can read all listings"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users AS admin_user
      WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
        AND admin_user.is_admin IS TRUE
    )
  );

-- Restrictive policies are combined with every permissive SELECT policy. This
-- prevents an older broad policy from exposing sale-era or unavailable rows.
DROP POLICY IF EXISTS "Restrict reads to active PG listings" ON public.properties;
CREATE POLICY "Restrict reads to active PG listings"
  ON public.properties
  AS RESTRICTIVE
  FOR SELECT
  TO public
  USING (
    (is_sold IS FALSE AND monthly_rent IS NOT NULL)
    OR (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1
        FROM public.users AS admin_user
        WHERE admin_user.clerk_id = (SELECT auth.jwt()->>'sub')
          AND admin_user.is_admin IS TRUE
      )
    )
  );

-- A table-level SELECT grant would expose columns beyond the app's public card
-- and detail model. Grant only the columns requested by PROPERTY_COLUMNS.
REVOKE SELECT ON TABLE public.properties FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id,
  title,
  description,
  room_type,
  monthly_rent,
  security_deposit,
  gender_preference,
  food_included,
  amenities,
  available_from,
  bedrooms,
  bathrooms,
  area_sqft,
  address,
  city,
  latitude,
  longitude,
  images,
  is_featured,
  is_sold,
  created_at
) ON TABLE public.properties TO anon, authenticated;

CREATE INDEX IF NOT EXISTS properties_active_pg_created_at_idx
  ON public.properties (created_at DESC, id ASC)
  WHERE is_sold IS FALSE AND monthly_rent IS NOT NULL;
