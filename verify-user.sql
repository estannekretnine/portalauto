-- SQL skripta za proveru da li korisnik postoji u bazi
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- 1. Proveri da li korisnik postoji (bez RLS filtera)
SELECT 
  id, 
  naziv, 
  email, 
  password,
  LENGTH(password) as password_length,
  LENGTH('marko123') as expected_password_length
FROM public.korisnici 
WHERE email = 'marko@example.com';

-- 2. Proveri sve korisnike u bazi (bez RLS filtera)
SELECT 
  id, 
  naziv, 
  email, 
  LENGTH(password) as password_length
FROM public.korisnici
ORDER BY id;

-- 3. Proveri da li postoji korisnik sa tačnim password-om
SELECT 
  id, 
  naziv, 
  email,
  password = 'marko123' as password_matches
FROM public.korisnici 
WHERE email = 'marko@example.com' 
  AND password = 'marko123';

-- 4. Proveri RLS politike za tabelu korisnici
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'korisnici'
ORDER BY policyname;

-- 5. Ako korisnik ne postoji, kreiraj ga direktno:
INSERT INTO public.korisnici (naziv, email, password)
VALUES ('Marko Petrović', 'marko@example.com', 'marko123')
ON CONFLICT DO NOTHING
RETURNING id, naziv, email;

