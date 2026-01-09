-- SQL skripta za dopunu tabele korisnici sa novim kolonama
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- 1. Dodaj kolonu brojmob (broj telefona)
ALTER TABLE public.korisnici 
ADD COLUMN IF NOT EXISTS brojmob VARCHAR(20);

-- 2. Dodaj kolonu stsstatus (status: kupac, prodavac, agent, admin, manager)
-- Koristimo CHECK constraint da ograničimo vrednosti
ALTER TABLE public.korisnici 
ADD COLUMN IF NOT EXISTS stsstatus VARCHAR(20);

-- Ažuriraj postojeće redove sa default vrednošću 'kupac' ako imaju NULL ili nevalidnu vrednost
UPDATE public.korisnici 
SET stsstatus = 'kupac'
WHERE stsstatus IS NULL 
   OR stsstatus NOT IN ('kupac', 'prodavac', 'agent', 'admin', 'manager');

-- Obriši postojeći constraint ako postoji (da možemo da ga ponovo kreiramo)
ALTER TABLE public.korisnici 
DROP CONSTRAINT IF EXISTS korisnici_stsstatus_check;

-- Dodaj CHECK constraint za validne status vrednosti
ALTER TABLE public.korisnici 
ADD CONSTRAINT korisnici_stsstatus_check 
CHECK (stsstatus IS NULL OR stsstatus IN ('kupac', 'prodavac', 'agent', 'admin', 'manager'));

-- 3. Dodaj kolonu stsaktivan sa default vrednošću 'da'
ALTER TABLE public.korisnici 
ADD COLUMN IF NOT EXISTS stsaktivan VARCHAR(2) DEFAULT 'da';

-- Ažuriraj postojeće redove sa default vrednošću 'da' ako imaju NULL ili nevalidnu vrednost
UPDATE public.korisnici 
SET stsaktivan = 'da'
WHERE stsaktivan IS NULL 
   OR stsaktivan NOT IN ('da', 'ne');

-- Obriši postojeći constraint ako postoji (da možemo da ga ponovo kreiramo)
ALTER TABLE public.korisnici 
DROP CONSTRAINT IF EXISTS korisnici_stsaktivan_check;

-- Dodaj CHECK constraint za stsaktivan (samo 'da' ili 'ne')
ALTER TABLE public.korisnici 
ADD CONSTRAINT korisnici_stsaktivan_check 
CHECK (stsaktivan IS NULL OR stsaktivan IN ('da', 'ne'));

-- 4. Dodaj kolonu datumk (timestamptz, jednokratno kad se kreira)
ALTER TABLE public.korisnici 
ADD COLUMN IF NOT EXISTS datumk TIMESTAMPTZ DEFAULT NOW();

-- 5. Dodaj kolonu datumpt (timestamptz, menja se kad se radi update automatski)
ALTER TABLE public.korisnici 
ADD COLUMN IF NOT EXISTS datumpt TIMESTAMPTZ DEFAULT NOW();

-- 6. Kreiraj funkciju za automatsko ažuriranje datumpt pri UPDATE
CREATE OR REPLACE FUNCTION update_datumpt()
RETURNS TRIGGER AS $$
BEGIN
  NEW.datumpt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Kreiraj trigger koji automatski ažurira datumpt pri UPDATE
DROP TRIGGER IF EXISTS trigger_update_datumpt ON public.korisnici;

CREATE TRIGGER trigger_update_datumpt
  BEFORE UPDATE ON public.korisnici
  FOR EACH ROW
  EXECUTE FUNCTION update_datumpt();

-- 8. Ažuriraj postojeće korisnike sa default vrednostima (ako nemaju)
UPDATE public.korisnici 
SET 
  stsaktivan = COALESCE(stsaktivan, 'da'),
  datumk = COALESCE(datumk, NOW()),
  datumpt = COALESCE(datumpt, NOW())
WHERE stsaktivan IS NULL OR datumk IS NULL OR datumpt IS NULL;

-- 9. Proveri strukturu tabele
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'korisnici'
ORDER BY ordinal_position;

-- 10. Proveri da li su triggeri kreirani
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'korisnici';
