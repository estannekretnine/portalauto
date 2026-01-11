-- SQL skripta za rešavanje RLS problema za tabelu ponuda
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- 1. Proveri postojeće RLS politike za tabelu ponuda
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'ponuda'
ORDER BY policyname;

-- 2. Obriši postojeće politike koje filtriraju rezultate
DROP POLICY IF EXISTS "Allow public read access" ON public.ponuda;
DROP POLICY IF EXISTS "Allow public insert" ON public.ponuda;
DROP POLICY IF EXISTS "Allow public update" ON public.ponuda;
DROP POLICY IF EXISTS "Allow public delete" ON public.ponuda;
DROP POLICY IF EXISTS "Users can view own data" ON public.ponuda;
DROP POLICY IF EXISTS "Users can insert own data" ON public.ponuda;
DROP POLICY IF EXISTS "Users can update own data" ON public.ponuda;
DROP POLICY IF EXISTS "Users can delete own data" ON public.ponuda;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON public.ponuda;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.ponuda;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.ponuda;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.ponuda;

-- 3. Kreiraj politike koje dozvoljavaju pristup za sve operacije
-- SELECT - dozvoljava svima da čitaju
CREATE POLICY "Allow public read access" ON public.ponuda
  FOR SELECT
  USING (true);

-- INSERT - dozvoljava svima da dodaju
CREATE POLICY "Allow public insert" ON public.ponuda
  FOR INSERT
  WITH CHECK (true);

-- UPDATE - dozvoljava svima da ažuriraju
CREATE POLICY "Allow public update" ON public.ponuda
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE - dozvoljava svima da brišu
CREATE POLICY "Allow public delete" ON public.ponuda
  FOR DELETE
  USING (true);

-- 4. Proveri da li su politike kreirane
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'ponuda'
ORDER BY policyname;

-- 5. Proveri da li sada možemo da vidimo ponude
SELECT COUNT(*) as total_ponuda FROM public.ponuda;
