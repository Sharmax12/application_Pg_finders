-- Defense-in-depth for legacy Supabase policies shown in the dashboard.
-- Apply after 20261027000000_security_policies.sql. These restrictive policies
-- are ANDed with permissive policies, so an older broad policy cannot expose
-- another user's private profile or saved listings.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

-- Remove old policy variants before recreating the intended owner-only rules.
DROP POLICY IF EXISTS "Users can delete own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can insert saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can insert own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can read own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Users can update own saved properties" ON public.saved_properties;

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

-- Critical guard: PostgreSQL combines restrictive policies with AND. This keeps
-- unknown/legacy permissive policies from ever broadening saved-list access.
DROP POLICY IF EXISTS "Restrict saved properties to owning Clerk user" ON public.saved_properties;
CREATE POLICY "Restrict saved properties to owning Clerk user"
  ON public.saved_properties
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (user_clerk_id = (SELECT auth.jwt()->>'sub'))
  WITH CHECK (user_clerk_id = (SELECT auth.jwt()->>'sub'));

-- Recreate the visible profile policies as owner-only and then enforce the
-- same owner predicate restrictively across every command.
DROP POLICY IF EXISTS "Users can insert own row" ON public.users;
DROP POLICY IF EXISTS "Users can read own row" ON public.users;
DROP POLICY IF EXISTS "Users can update own row" ON public.users;

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

DROP POLICY IF EXISTS "Restrict users to owning Clerk user" ON public.users;
CREATE POLICY "Restrict users to owning Clerk user"
  ON public.users
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (clerk_id = (SELECT auth.jwt()->>'sub'))
  WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

-- Remove any anonymous or PUBLIC table grants as well as row-level access.
REVOKE ALL ON public.users FROM anon, PUBLIC;
REVOKE ALL ON public.saved_properties FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_properties TO authenticated;
