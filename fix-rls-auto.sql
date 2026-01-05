-- SQL skripta za rešavanje RLS problema za tabelu auto
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- 1. Proveri postojeće RLS politike za tabelu auto
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'auto'
ORDER BY policyname;

-- 2. Obriši postojeće politike koje filtriraju rezultate
DROP POLICY IF EXISTS "Allow public read access" ON public.auto;
DROP POLICY IF EXISTS "Allow public insert" ON public.auto;
DROP POLICY IF EXISTS "Allow public update" ON public.auto;
DROP POLICY IF EXISTS "Allow public delete" ON public.auto;
DROP POLICY IF EXISTS "Users can view own data" ON public.auto;
DROP POLICY IF EXISTS "Users can insert own data" ON public.auto;
DROP POLICY IF EXISTS "Users can update own data" ON public.auto;
DROP POLICY IF EXISTS "Users can delete own data" ON public.auto;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON public.auto;

-- 3. Kreiraj politike koje dozvoljavaju pristup za sve operacije
-- SELECT - dozvoljava svima da čitaju
CREATE POLICY "Allow public read access" ON public.auto
  FOR SELECT
  USING (true);

-- INSERT - dozvoljava svima da dodaju
CREATE POLICY "Allow public insert" ON public.auto
  FOR INSERT
  WITH CHECK (true);

-- UPDATE - dozvoljava svima da ažuriraju
CREATE POLICY "Allow public update" ON public.auto
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE - dozvoljava svima da brišu
CREATE POLICY "Allow public delete" ON public.auto
  FOR DELETE
  USING (true);

-- 4. Proveri da li su politike kreirane
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'auto'
ORDER BY policyname;

-- 5. Proveri da li sada možemo da vidimo automobile
SELECT COUNT(*) as total_autos FROM public.auto;

