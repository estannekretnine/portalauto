-- Dodaj nove kolone u tabelu traznja
-- Izvršiti jedan po jedan upit u Supabase SQL Editor-u

-- 1. Kolona za status aktivnosti (true = aktivna, false = arhivirana)
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS stsaktivan boolean DEFAULT true

-- 2. Kolona za datum brisanja/arhiviranja
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS datumbrisanja timestamp with time zone NULL

-- 3. Kolona za tip tražnje (kupac ili zakupac)
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS stskupaczakupac text NULL

-- 4. Kolona za razlog brisanja/arhiviranja
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS razlogbrisanja text NULL

-- 5. Ažuriraj postojeće zapise da imaju default vrednosti
UPDATE public.traznja SET stsaktivan = true WHERE stsaktivan IS NULL
