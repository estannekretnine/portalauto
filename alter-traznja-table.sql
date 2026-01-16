-- Dodaj nove kolone u tabelu traznja

-- Kolona za status aktivnosti (true = aktivna, false = arhivirana)
ALTER TABLE public.traznja 
ADD COLUMN IF NOT EXISTS stsaktivan boolean DEFAULT true;

-- Kolona za datum brisanja/arhiviranja
ALTER TABLE public.traznja 
ADD COLUMN IF NOT EXISTS datumbrisanja timestamp with time zone NULL;

-- Kolona za tip tražnje (kupac ili zakupac)
ALTER TABLE public.traznja 
ADD COLUMN IF NOT EXISTS stskupaczakupac text NULL;

-- Dodaj constraint za stskupaczakupac (opciono)
-- ALTER TABLE public.traznja 
-- ADD CONSTRAINT chk_stskupaczakupac CHECK (stskupaczakupac IN ('kupac', 'zakupac'));

-- Ažuriraj postojeće zapise da imaju default vrednosti
UPDATE public.traznja 
SET stsaktivan = true 
WHERE stsaktivan IS NULL;

-- Prikaži strukturu tabele
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'traznja' 
ORDER BY ordinal_position;
