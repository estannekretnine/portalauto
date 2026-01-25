-- ============================================================
-- SINHRONIZACIJA: korisnici -> korisnici_arhiva
-- Koristi PostgreSQL Triggere umesto sistemske replikacije
-- ============================================================

-- 1. KREIRANJE ODREDIŠNE TABELE (ako ne postoji)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.korisnici_arhiva (
    id UUID NOT NULL,
    ime TEXT,
    email TEXT,
    status TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    arhivirano_u TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, arhivirano_u)
);

-- Indeks za brže pretrage po id-u
CREATE INDEX IF NOT EXISTS idx_korisnici_arhiva_id ON public.korisnici_arhiva(id);

-- Indeks za brže pretrage po datumu arhiviranja
CREATE INDEX IF NOT EXISTS idx_korisnici_arhiva_datum ON public.korisnici_arhiva(arhivirano_u DESC);

-- Komentar na tabelu
COMMENT ON TABLE public.korisnici_arhiva IS 'Arhiva svih promena u tabeli korisnici - sinhronizovano putem triggera';


-- 2. FUNKCIJA ZA SINHRONIZACIJU
-- ============================================================
-- Opcija A: UPSERT pristup (ažurira postojeći red ako postoji)
-- Bolje za performanse ako ti treba samo poslednje stanje

CREATE OR REPLACE FUNCTION sync_korisnici_to_arhiva_upsert()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT ili UPDATE u arhivu (UPSERT po id-u)
    INSERT INTO public.korisnici_arhiva (id, ime, email, status, updated_at, arhivirano_u)
    VALUES (NEW.id, NEW.ime, NEW.email, NEW.status, NEW.updated_at, NOW())
    ON CONFLICT (id, arhivirano_u) 
    DO UPDATE SET
        ime = EXCLUDED.ime,
        email = EXCLUDED.email,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at,
        arhivirano_u = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Opcija B: INSERT ALWAYS pristup (čuva istoriju svih promena)
-- Bolje ako želiš punu istoriju promena (audit log)

CREATE OR REPLACE FUNCTION sync_korisnici_to_arhiva_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Uvek dodaj novi red u arhivu (čuva kompletnu istoriju)
    INSERT INTO public.korisnici_arhiva (id, ime, email, status, updated_at, arhivirano_u)
    VALUES (NEW.id, NEW.ime, NEW.email, NEW.status, NEW.updated_at, NOW());
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. KREIRANJE TRIGGERA
-- ============================================================
-- Prvo obriši postojeće triggere ako postoje
DROP TRIGGER IF EXISTS trg_korisnici_sync_insert ON public.korisnici;
DROP TRIGGER IF EXISTS trg_korisnici_sync_update ON public.korisnici;
DROP TRIGGER IF EXISTS trg_korisnici_sync ON public.korisnici;

-- IZABERI JEDNU OD OPCIJA:

-- ============================================================
-- OPCIJA A: UPSERT (samo poslednje stanje, bolje performanse)
-- ============================================================
-- Odkomentariši sledeće linije ako želiš UPSERT pristup:

-- CREATE TRIGGER trg_korisnici_sync
-- AFTER INSERT OR UPDATE ON public.korisnici
-- FOR EACH ROW
-- EXECUTE FUNCTION sync_korisnici_to_arhiva_upsert();


-- ============================================================
-- OPCIJA B: HISTORY (puna istorija promena - PREPORUČENO)
-- ============================================================
-- Ova opcija je aktivna po defaultu:

CREATE TRIGGER trg_korisnici_sync
AFTER INSERT OR UPDATE ON public.korisnici
FOR EACH ROW
EXECUTE FUNCTION sync_korisnici_to_arhiva_history();


-- 4. RLS POLITIKE ZA ARHIVU (opciono)
-- ============================================================
ALTER TABLE public.korisnici_arhiva ENABLE ROW LEVEL SECURITY;

-- Samo admin može čitati arhivu
DROP POLICY IF EXISTS "Admin can read archive" ON public.korisnici_arhiva;
CREATE POLICY "Admin can read archive" 
ON public.korisnici_arhiva 
FOR SELECT 
USING (true);  -- Prilagodi prema potrebi (npr. provera admin role)

-- Niko ne može direktno pisati u arhivu (samo trigger)
DROP POLICY IF EXISTS "No direct insert to archive" ON public.korisnici_arhiva;
CREATE POLICY "No direct insert to archive" 
ON public.korisnici_arhiva 
FOR INSERT 
WITH CHECK (false);


-- 5. POMOĆNE FUNKCIJE
-- ============================================================

-- Funkcija za dobijanje istorije promena za korisnika
CREATE OR REPLACE FUNCTION get_korisnik_history(p_korisnik_id UUID)
RETURNS TABLE (
    id UUID,
    ime TEXT,
    email TEXT,
    status TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    arhivirano_u TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ka.id,
        ka.ime,
        ka.email,
        ka.status,
        ka.updated_at,
        ka.arhivirano_u
    FROM public.korisnici_arhiva ka
    WHERE ka.id = p_korisnik_id
    ORDER BY ka.arhivirano_u DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Funkcija za čišćenje stare arhive (starije od N dana)
CREATE OR REPLACE FUNCTION cleanup_old_archive(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.korisnici_arhiva
    WHERE arhivirano_u < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. VERIFIKACIJA
-- ============================================================
-- Proveri da li je trigger kreiran
SELECT 
    tgname AS trigger_name,
    tgtype AS trigger_type,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.korisnici'::regclass
AND tgname LIKE 'trg_korisnici%';

-- Proveri strukturu arhivne tabele
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'korisnici_arhiva'
ORDER BY ordinal_position;


-- ============================================================
-- NAPOMENA O KORIŠĆENJU:
-- ============================================================
-- 
-- 1. Pokreni ovu skriptu u Supabase SQL Editor-u
-- 
-- 2. Za testiranje:
--    INSERT INTO korisnici (id, ime, email, status) 
--    VALUES (gen_random_uuid(), 'Test', 'test@test.com', 'active');
--    
--    -- Proveri arhivu:
--    SELECT * FROM korisnici_arhiva ORDER BY arhivirano_u DESC;
--
-- 3. Za dobijanje istorije korisnika:
--    SELECT * FROM get_korisnik_history('uuid-korisnika');
--
-- 4. Za čišćenje stare arhive (starije od 90 dana):
--    SELECT cleanup_old_archive(90);
--
-- ============================================================
