-- SQL skripta za dodavanje kolone adresa u tabelu korisnici
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- Dodaj kolonu adresa (text)
ALTER TABLE public.korisnici 
ADD COLUMN IF NOT EXISTS adresa TEXT;

-- Proveri da li je kolona dodata
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'korisnici'
  AND column_name = 'adresa';
