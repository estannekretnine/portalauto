-- SQL skripta za rešavanje RLS problema za tabelu vrstaobjekta
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- 1. Proveri da li je RLS omogućen za tabelu
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'vrstaobjekta';

-- 2. Omogući RLS ako nije već omogućen
ALTER TABLE public.vrstaobjekta ENABLE ROW LEVEL SECURITY;

-- 3. Proveri postojeće RLS politike za tabelu vrstaobjekta
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'vrstaobjekta'
ORDER BY policyname;

-- 4. Obriši postojeće politike koje filtriraju rezultate (ako postoje)
DROP POLICY IF EXISTS "Allow public read access" ON public.vrstaobjekta;
DROP POLICY IF EXISTS "Allow public insert" ON public.vrstaobjekta;
DROP POLICY IF EXISTS "Allow public update" ON public.vrstaobjekta;
DROP POLICY IF EXISTS "Allow public delete" ON public.vrstaobjekta;
DROP POLICY IF EXISTS "Users can view own data" ON public.vrstaobjekta;
DROP POLICY IF EXISTS "Users can insert own data" ON public.vrstaobjekta;
DROP POLICY IF EXISTS "Users can update own data" ON public.vrstaobjekta;
DROP POLICY IF EXISTS "Users can delete own data" ON public.vrstaobjekta;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON public.vrstaobjekta;

-- 5. Kreiraj politike koje dozvoljavaju pristup za sve operacije
-- SELECT - dozvoljava svima da čitaju
CREATE POLICY "Allow public read access" ON public.vrstaobjekta
  FOR SELECT
  USING (true);

-- INSERT - dozvoljava svima da dodaju
CREATE POLICY "Allow public insert" ON public.vrstaobjekta
  FOR INSERT
  WITH CHECK (true);

-- UPDATE - dozvoljava svima da ažuriraju
CREATE POLICY "Allow public update" ON public.vrstaobjekta
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE - dozvoljava svima da brišu
CREATE POLICY "Allow public delete" ON public.vrstaobjekta
  FOR DELETE
  USING (true);

-- 6. Proveri da li su politike kreirane
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vrstaobjekta'
ORDER BY policyname;

-- 7. Proveri da li sada možemo da vidimo vrste objekata
SELECT COUNT(*) as total_vrste_objekata FROM public.vrstaobjekta;

-- 8. Test INSERT operacije (opciono - možete obrisati nakon testiranja)
-- INSERT INTO public.vrstaobjekta (opis) VALUES ('Test vrsta objekta');
-- SELECT * FROM public.vrstaobjekta WHERE opis = 'Test vrsta objekta';
-- DELETE FROM public.vrstaobjekta WHERE opis = 'Test vrsta objekta';
