-- SQL skripta za rešavanje RLS problema
-- Pokrenite ovu skriptu u Supabase SQL Editor-u ako RLS blokira pristup

-- Opcija 1: Onemogući RLS za tabelu korisnici (NE PREPORUČUJE SE ZA PRODUCTION)
-- ALTER TABLE public.korisnici DISABLE ROW LEVEL SECURITY;

-- Opcija 2: Obriši postojeće politike i kreiraj novu koja dozvoljava SELECT
-- Obriši postojeće politike (ako postoje)
DROP POLICY IF EXISTS "Allow public read access" ON public.korisnici;
DROP POLICY IF EXISTS "Allow select for login" ON public.korisnici;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.korisnici;

-- Kreiraj politiku koja dozvoljava SELECT za sve (anon korisnike)
CREATE POLICY "Allow public read access" ON public.korisnici
  FOR SELECT
  USING (true);

-- Opcija 3: Ako želite da dozvolite i INSERT za seed operacije (opciono)
-- CREATE POLICY "Allow public insert" ON public.korisnici
--   FOR INSERT
--   WITH CHECK (true);

-- Proveri da li je politika kreirana
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'korisnici';

