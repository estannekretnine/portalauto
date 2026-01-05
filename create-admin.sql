-- SQL skripta za kreiranje admin korisnika
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- Kreiraj admin korisnika
INSERT INTO public.korisnici (naziv, email, password)
SELECT 'Admin', 'admin@example.com', 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM public.korisnici WHERE email = 'admin@example.com')
RETURNING id, naziv, email;

-- Proveri kreiranog admin korisnika
SELECT id, naziv, email FROM public.korisnici WHERE email = 'admin@example.com';

