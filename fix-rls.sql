-- SQL skripta za rešavanje RLS problema za tabelu korisnici
-- Pokrenite ovu skriptu u Supabase SQL Editor-u ako RLS blokira pristup

-- VAŽNO: Ako query vraća prazan niz iako korisnik postoji, RLS politika verovatno filtrira rezultate!

-- 1. Obriši postojeće politike koje filtriraju rezultate
DROP POLICY IF EXISTS "Allow public read access" ON public.korisnici;
DROP POLICY IF EXISTS "Allow select for login" ON public.korisnici;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.korisnici;
DROP POLICY IF EXISTS "Users can view own data" ON public.korisnici;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON public.korisnici;
DROP POLICY IF EXISTS "Allow public insert" ON public.korisnici;
DROP POLICY IF EXISTS "Allow public update" ON public.korisnici;
DROP POLICY IF EXISTS "Allow public delete" ON public.korisnici;

-- 2. Kreiraj politike koje dozvoljavaju pristup za sve operacije
-- SELECT - dozvoljava svima da čitaju (potrebno za login)
CREATE POLICY "Allow public read access" ON public.korisnici
  FOR SELECT
  USING (true);  -- true = dozvoljava svima da vide sve korisnike

-- INSERT - dozvoljava svima da dodaju (za seed operacije)
CREATE POLICY "Allow public insert" ON public.korisnici
  FOR INSERT
  WITH CHECK (true);

-- UPDATE - dozvoljava svima da ažuriraju
CREATE POLICY "Allow public update" ON public.korisnici
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE - dozvoljava svima da brišu
CREATE POLICY "Allow public delete" ON public.korisnici
  FOR DELETE
  USING (true);

-- 3. Proveri da li su politike kreirane
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'korisnici'
ORDER BY policyname;

-- 4. Proveri da li sada možemo da vidimo korisnike
SELECT id, naziv, email FROM public.korisnici LIMIT 10;

