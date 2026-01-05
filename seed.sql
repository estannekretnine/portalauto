-- SQL skripta za seedovanje baze podataka
-- Pokrenite ovu skriptu u Supabase SQL Editor-u (Dashboard -> SQL Editor -> New Query)

-- Obriši sve postojeće automobile
DELETE FROM public.auto;

-- Obriši postojeće test korisnike (opciono - uklonite komentar ako želite da obrišete postojeće)
-- DELETE FROM public.korisnici WHERE email IN ('marko@example.com', 'ana@example.com');

-- Kreiraj korisnike (koristi NOT EXISTS da izbegne duplikate)
INSERT INTO public.korisnici (naziv, email, password)
SELECT 'Marko Petrović', 'marko@example.com', 'marko123'
WHERE NOT EXISTS (SELECT 1 FROM public.korisnici WHERE email = 'marko@example.com');

INSERT INTO public.korisnici (naziv, email, password)
SELECT 'Ana Jovanović', 'ana@example.com', 'ana123'
WHERE NOT EXISTS (SELECT 1 FROM public.korisnici WHERE email = 'ana@example.com');

-- Alternativno, ako email ima UNIQUE constraint, koristite:
-- INSERT INTO public.korisnici (naziv, email, password)
-- VALUES 
--   ('Marko Petrović', 'marko@example.com', 'marko123'),
--   ('Ana Jovanović', 'ana@example.com', 'ana123')
-- ON CONFLICT (email) DO NOTHING;

-- Proveri kreirane korisnike
SELECT id, naziv, email FROM public.korisnici WHERE email IN ('marko@example.com', 'ana@example.com');

