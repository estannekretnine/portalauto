-- SQL skripta za kreiranje RLS politika za tabelu pozivi
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- 1. Omogući RLS na tabeli (ako već nije)
ALTER TABLE public.pozivi ENABLE ROW LEVEL SECURITY;

-- 2. Obriši postojeće politike ako postoje
DROP POLICY IF EXISTS "Allow public read access" ON public.pozivi;
DROP POLICY IF EXISTS "Allow public insert" ON public.pozivi;
DROP POLICY IF EXISTS "Allow public update" ON public.pozivi;
DROP POLICY IF EXISTS "Allow public delete" ON public.pozivi;
DROP POLICY IF EXISTS "Users can view own data" ON public.pozivi;
DROP POLICY IF EXISTS "Users can insert own data" ON public.pozivi;
DROP POLICY IF EXISTS "Users can update own data" ON public.pozivi;
DROP POLICY IF EXISTS "Users can delete own data" ON public.pozivi;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON public.pozivi;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.pozivi;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.pozivi;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.pozivi;

-- 3. Kreiraj politike koje dozvoljavaju pristup za sve operacije
-- SELECT - dozvoljava svima da čitaju
CREATE POLICY "Allow public read access" ON public.pozivi
  FOR SELECT
  USING (true);

-- INSERT - dozvoljava svima da dodaju
CREATE POLICY "Allow public insert" ON public.pozivi
  FOR INSERT
  WITH CHECK (true);

-- UPDATE - dozvoljava svima da ažuriraju
CREATE POLICY "Allow public update" ON public.pozivi
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE - dozvoljava svima da brišu
CREATE POLICY "Allow public delete" ON public.pozivi
  FOR DELETE
  USING (true);

-- 4. Proveri da li su politike kreirane
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pozivi'
ORDER BY policyname;

-- 5. Proveri da li sada možemo da vidimo pozive
SELECT COUNT(*) as total_pozivi FROM public.pozivi;
