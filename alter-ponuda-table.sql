-- Ako kolona datumbrisanja već postoji sa pogrešnim tipom, obriši je i ponovo kreiraj
ALTER TABLE public.ponuda
DROP COLUMN IF EXISTS datumbrisanja;

-- Dodavanje kolone datumbrisanja sa ispravnim tipom timestamp
ALTER TABLE public.ponuda
ADD COLUMN datumbrisanja timestamp with time zone NULL;

-- Dodavanje kolone razlogbrisanja u ponuda tabelu (ako ne postoji)
ALTER TABLE public.ponuda
ADD COLUMN IF NOT EXISTS razlogbrisanja text NULL;
