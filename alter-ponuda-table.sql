-- ISPRAVKA: Kolona datumbrisanja ima pogrešan tip
-- Izvršiti jedan po jedan upit u Supabase SQL Editor-u

-- 1. Obriši staru kolonu sa pogrešnim tipom
ALTER TABLE public.ponuda DROP COLUMN IF EXISTS datumbrisanja;

-- 2. Dodaj kolonu sa ispravnim tipom (date umesto time)
ALTER TABLE public.ponuda ADD COLUMN datumbrisanja date NULL;

-- 3. Dodaj razlogbrisanja ako ne postoji
ALTER TABLE public.ponuda ADD COLUMN IF NOT EXISTS razlogbrisanja text NULL;

-- 4. Dodaj stsstorniran kolonu za storno status
ALTER TABLE public.ponuda ADD COLUMN IF NOT EXISTS stsstorniran boolean DEFAULT false;
