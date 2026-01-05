-- SQL skripta za seedovanje baze podataka
-- Pokrenite ovu skriptu u Supabase SQL Editor-u (Dashboard -> SQL Editor -> New Query)

-- VAŽNO: Prvo pokrenite fix-rls.sql da omogućite pristup tabeli!

-- Obriši sve postojeće automobile
DELETE FROM public.auto;

-- Obriši postojeće test korisnike (opciono - uklonite komentar ako želite da obrišete postojeće)
-- DELETE FROM public.korisnici WHERE email IN ('marko@example.com', 'ana@example.com');

-- Kreiraj korisnike (koristi NOT EXISTS da izbegne duplikate)
INSERT INTO public.korisnici (naziv, email, password)
SELECT 'Marko Petrović', 'marko@example.com', 'marko123'
WHERE NOT EXISTS (SELECT 1 FROM public.korisnici WHERE email = 'marko@example.com')
RETURNING id, naziv, email;

INSERT INTO public.korisnici (naziv, email, password)
SELECT 'Ana Jovanović', 'ana@example.com', 'ana123'
WHERE NOT EXISTS (SELECT 1 FROM public.korisnici WHERE email = 'ana@example.com')
RETURNING id, naziv, email;

-- Proveri kreirane korisnike (bez RLS filtera)
SELECT id, naziv, email, LENGTH(password) as password_length 
FROM public.korisnici 
WHERE email IN ('marko@example.com', 'ana@example.com');

-- Proveri da li se password-ovi poklapaju
SELECT 
  id,
  email,
  password = 'marko123' as marko_password_matches,
  password = 'ana123' as ana_password_matches
FROM public.korisnici 
WHERE email IN ('marko@example.com', 'ana@example.com');

