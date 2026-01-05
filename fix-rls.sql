-- SQL skripta za rešavanje RLS problema
-- Pokrenite ovu skriptu u Supabase SQL Editor-u ako RLS blokira pristup

-- VAŽNO: Ako query vraća prazan niz iako korisnik postoji, RLS politika verovatno filtrira rezultate!

-- Opcija 1: Obriši postojeće politike koje filtriraju rezultate
DROP POLICY IF EXISTS "Allow public read access" ON public.korisnici;
DROP POLICY IF EXISTS "Allow select for login" ON public.korisnici;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.korisnici;
DROP POLICY IF EXISTS "Users can view own data" ON public.korisnici;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON public.korisnici;

-- Opcija 2: Kreiraj politiku koja dozvoljava SELECT za SVE (anon korisnike)
-- Ovo je potrebno za login funkcionalnost
CREATE POLICY "Allow public read access" ON public.korisnici
  FOR SELECT
  USING (true);  -- true = dozvoljava svima da vide sve korisnike

-- Opcija 3: Ako želite da dozvolite i INSERT za seed operacije (opciono)
CREATE POLICY "Allow public insert" ON public.korisnici
  FOR INSERT
  WITH CHECK (true);

-- Proveri da li su politike kreirane
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'korisnici';

-- Proveri da li sada možemo da vidimo korisnike
SELECT id, naziv, email FROM public.korisnici LIMIT 10;

