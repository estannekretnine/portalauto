-- SQL skripta za proveru i podešavanje RLS politika
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- 1. Proveri da li je RLS omogućen na tabeli korisnici
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'korisnici';

-- 2. Proveri postojeće RLS politike za tabelu korisnici
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'korisnici';

-- 3. Ako RLS blokira pristup, možete privremeno onemogućiti RLS (NE PREPORUČUJE SE ZA PRODUCTION):
-- ALTER TABLE public.korisnici DISABLE ROW LEVEL SECURITY;

-- 4. ILI kreirajte politiku koja dozvoljava SELECT za sve (anon korisnike):
-- CREATE POLICY "Allow public read access" ON public.korisnici
--   FOR SELECT
--   USING (true);

-- 5. ILI kreirajte politiku koja dozvoljava SELECT samo za određene uslove:
-- CREATE POLICY "Allow select for login" ON public.korisnici
--   FOR SELECT
--   USING (true); -- Dozvoljava svima da čitaju (za login proveru)

-- 6. Proveri sve korisnike u bazi
SELECT id, naziv, email, LENGTH(password) as password_length FROM public.korisnici;

-- 7. Proveri specifičnog korisnika
SELECT id, naziv, email, password, LENGTH(password) as password_length 
FROM public.korisnici 
WHERE email = 'marko@example.com';

