-- Dodaj nove kolone u tabelu traznja
-- Izvršiti jedan po jedan upit u Supabase SQL Editor-u

-- 1. Kolona za status aktivnosti (true = aktivna, false = arhivirana)
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS stsaktivan boolean DEFAULT true;

-- 2. Kolona za datum brisanja/arhiviranja
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS datumbrisanja timestamp with time zone NULL;

-- 3. Kolona za tip tražnje (kupac ili zakupac)
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS stskupaczakupac text NULL;

-- 4. Ažuriraj postojeće zapise da imaju default vrednosti
UPDATE public.traznja SET stsaktivan = true WHERE stsaktivan IS NULL;

-- ============================================
-- NOVA POLJA - Dodato 16.01.2026
-- ============================================

-- 5. Kolona za sprat od (numeric)
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS spratod numeric NULL;

-- 6. Kolona za sprat do (numeric)
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS spratdo numeric NULL;

-- 7. Kolona za "neće zadnji sprat" (boolean)
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS stsnecezadnjispratat boolean DEFAULT false;

-- 8. Kolona za "neće suteren" (boolean)
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS stsnecesuteren boolean DEFAULT false;

-- 9. Kolona za korisnika (foreign key na korisnici tabelu)
ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS iduser integer NULL;

-- 10. Dodaj foreign key constraint za iduser
ALTER TABLE public.traznja 
ADD CONSTRAINT fk_traznja_korisnici 
FOREIGN KEY (iduser) REFERENCES public.korisnici(id) ON DELETE SET NULL;

-- 11. Kreiraj index za brže pretrage po korisniku
CREATE INDEX IF NOT EXISTS idx_traznja_iduser ON public.traznja(iduser);
