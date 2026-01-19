-- Provera i popravka RLS politika za ponuda tabelu
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- 1. Prvo proveri da li je RLS uključen
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'ponuda';

-- 2. Proveri postojeće politike
SELECT 
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'ponuda'
ORDER BY policyname;

-- 3. Uključi RLS ako nije uključen
ALTER TABLE public.ponuda ENABLE ROW LEVEL SECURITY;

-- 4. Obriši sve postojeće politike
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
DROP POLICY IF EXISTS "Svi mogu citati ponude" ON public.ponuda;
DROP POLICY IF EXISTS "Authenticated users can read" ON public.ponuda;

-- 5. Kreiraj nove politike - DOZVOLJAVA SVIMA PRISTUP
CREATE POLICY "Allow public read access" ON public.ponuda
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert" ON public.ponuda
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.ponuda
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete" ON public.ponuda
  FOR DELETE
  USING (true);

-- 6. Proveri ponovo politike
SELECT 
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'ponuda'
ORDER BY policyname;

-- 7. Test - proveri broj ponuda
SELECT COUNT(*) as total_ponuda FROM public.ponuda;
