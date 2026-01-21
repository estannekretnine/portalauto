-- SQL skripta za dodavanje kolone idmedij u tabelu pozivi
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- Dodaj kolonu idmedij u tabelu pozivi
ALTER TABLE public.pozivi 
ADD COLUMN IF NOT EXISTS idmedij bigint NULL;

-- Dodaj foreign key constraint ka tabeli mediji
ALTER TABLE public.pozivi 
ADD CONSTRAINT fk_pozivi_mediji 
FOREIGN KEY (idmedij) 
REFERENCES public.mediji(id) 
ON DELETE SET NULL;

-- Proveri da li je kolona dodata
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'pozivi' AND column_name = 'idmedij';
