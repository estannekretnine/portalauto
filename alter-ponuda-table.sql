-- Dodavanje kolone datumbrisanja u ponuda tabelu
ALTER TABLE public.ponuda
ADD COLUMN IF NOT EXISTS datumbrisanja timestamp without time zone NULL;

-- Dodavanje kolone razlogbrisanja u ponuda tabelu
ALTER TABLE public.ponuda
ADD COLUMN IF NOT EXISTS razlogbrisanja text NULL;
