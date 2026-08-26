-- Fix RLS: drop and recreate policies cleanly, restrict anon to SELECT only

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view accessories" ON public.accessories;

-- 2. Recreate permissive SELECT policies for anon + authenticated
CREATE POLICY "Public can view categories"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can view accessories"
  ON public.accessories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Revoke overly broad grants from anon (should only SELECT, not INSERT/UPDATE/DELETE)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.categories FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.accessories FROM anon;

-- 4. Same for authenticated (reads only)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.categories FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.accessories FROM authenticated;

-- 5. Verify (run after to confirm)
-- SELECT policyname, cmd, roles, qual FROM pg_policies WHERE schemaname='public' AND tablename IN ('categories','accessories');
