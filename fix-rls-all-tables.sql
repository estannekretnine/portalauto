-- Popravka RLS politika za SVE tabele koje koristi aplikacija
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- ============================================
-- PONUDA
-- ============================================
ALTER TABLE public.ponuda ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.ponuda;
DROP POLICY IF EXISTS "Allow public insert" ON public.ponuda;
DROP POLICY IF EXISTS "Allow public update" ON public.ponuda;
DROP POLICY IF EXISTS "Allow public delete" ON public.ponuda;
CREATE POLICY "Allow public read access" ON public.ponuda FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.ponuda FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.ponuda FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.ponuda FOR DELETE USING (true);

-- ============================================
-- TRAZNJA
-- ============================================
ALTER TABLE public.traznja ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.traznja;
DROP POLICY IF EXISTS "Allow public insert" ON public.traznja;
DROP POLICY IF EXISTS "Allow public update" ON public.traznja;
DROP POLICY IF EXISTS "Allow public delete" ON public.traznja;
CREATE POLICY "Allow public read access" ON public.traznja FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.traznja FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.traznja FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.traznja FOR DELETE USING (true);

-- ============================================
-- VRSTAOBJEKTA
-- ============================================
ALTER TABLE public.vrstaobjekta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.vrstaobjekta;
DROP POLICY IF EXISTS "Allow public insert" ON public.vrstaobjekta;
DROP POLICY IF EXISTS "Allow public update" ON public.vrstaobjekta;
DROP POLICY IF EXISTS "Allow public delete" ON public.vrstaobjekta;
CREATE POLICY "Allow public read access" ON public.vrstaobjekta FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.vrstaobjekta FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.vrstaobjekta FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.vrstaobjekta FOR DELETE USING (true);

-- ============================================
-- OPSTINA
-- ============================================
ALTER TABLE public.opstina ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.opstina;
DROP POLICY IF EXISTS "Allow public insert" ON public.opstina;
DROP POLICY IF EXISTS "Allow public update" ON public.opstina;
DROP POLICY IF EXISTS "Allow public delete" ON public.opstina;
CREATE POLICY "Allow public read access" ON public.opstina FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.opstina FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.opstina FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.opstina FOR DELETE USING (true);

-- ============================================
-- LOKACIJA
-- ============================================
ALTER TABLE public.lokacija ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.lokacija;
DROP POLICY IF EXISTS "Allow public insert" ON public.lokacija;
DROP POLICY IF EXISTS "Allow public update" ON public.lokacija;
DROP POLICY IF EXISTS "Allow public delete" ON public.lokacija;
CREATE POLICY "Allow public read access" ON public.lokacija FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.lokacija FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.lokacija FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.lokacija FOR DELETE USING (true);

-- ============================================
-- ULICA
-- ============================================
ALTER TABLE public.ulica ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.ulica;
DROP POLICY IF EXISTS "Allow public insert" ON public.ulica;
DROP POLICY IF EXISTS "Allow public update" ON public.ulica;
DROP POLICY IF EXISTS "Allow public delete" ON public.ulica;
CREATE POLICY "Allow public read access" ON public.ulica FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.ulica FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.ulica FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.ulica FOR DELETE USING (true);

-- ============================================
-- GRAD
-- ============================================
ALTER TABLE public.grad ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.grad;
DROP POLICY IF EXISTS "Allow public insert" ON public.grad;
DROP POLICY IF EXISTS "Allow public update" ON public.grad;
DROP POLICY IF EXISTS "Allow public delete" ON public.grad;
CREATE POLICY "Allow public read access" ON public.grad FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.grad FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.grad FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.grad FOR DELETE USING (true);

-- ============================================
-- DRZAVA
-- ============================================
ALTER TABLE public.drzava ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.drzava;
DROP POLICY IF EXISTS "Allow public insert" ON public.drzava;
DROP POLICY IF EXISTS "Allow public update" ON public.drzava;
DROP POLICY IF EXISTS "Allow public delete" ON public.drzava;
CREATE POLICY "Allow public read access" ON public.drzava FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.drzava FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.drzava FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.drzava FOR DELETE USING (true);

-- ============================================
-- KORISNICI
-- ============================================
ALTER TABLE public.korisnici ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.korisnici;
DROP POLICY IF EXISTS "Allow public insert" ON public.korisnici;
DROP POLICY IF EXISTS "Allow public update" ON public.korisnici;
DROP POLICY IF EXISTS "Allow public delete" ON public.korisnici;
CREATE POLICY "Allow public read access" ON public.korisnici FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.korisnici FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.korisnici FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.korisnici FOR DELETE USING (true);

-- ============================================
-- INFO
-- ============================================
ALTER TABLE public.info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.info;
DROP POLICY IF EXISTS "Allow public insert" ON public.info;
DROP POLICY IF EXISTS "Allow public update" ON public.info;
DROP POLICY IF EXISTS "Allow public delete" ON public.info;
CREATE POLICY "Allow public read access" ON public.info FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.info FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.info FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.info FOR DELETE USING (true);

-- ============================================
-- PONUDAFOTO (ako postoji)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ponudafoto') THEN
    ALTER TABLE public.ponudafoto ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read access" ON public.ponudafoto;
    DROP POLICY IF EXISTS "Allow public insert" ON public.ponudafoto;
    DROP POLICY IF EXISTS "Allow public update" ON public.ponudafoto;
    DROP POLICY IF EXISTS "Allow public delete" ON public.ponudafoto;
    CREATE POLICY "Allow public read access" ON public.ponudafoto FOR SELECT USING (true);
    CREATE POLICY "Allow public insert" ON public.ponudafoto FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update" ON public.ponudafoto FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public delete" ON public.ponudafoto FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================
-- POZIVI (ako postoji)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pozivi') THEN
    ALTER TABLE public.pozivi ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read access" ON public.pozivi;
    DROP POLICY IF EXISTS "Allow public insert" ON public.pozivi;
    DROP POLICY IF EXISTS "Allow public update" ON public.pozivi;
    DROP POLICY IF EXISTS "Allow public delete" ON public.pozivi;
    CREATE POLICY "Allow public read access" ON public.pozivi FOR SELECT USING (true);
    CREATE POLICY "Allow public insert" ON public.pozivi FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update" ON public.pozivi FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public delete" ON public.pozivi FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================
-- GREJANJE (ako postoji)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grejanje') THEN
    ALTER TABLE public.grejanje ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read access" ON public.grejanje;
    DROP POLICY IF EXISTS "Allow public insert" ON public.grejanje;
    DROP POLICY IF EXISTS "Allow public update" ON public.grejanje;
    DROP POLICY IF EXISTS "Allow public delete" ON public.grejanje;
    CREATE POLICY "Allow public read access" ON public.grejanje FOR SELECT USING (true);
    CREATE POLICY "Allow public insert" ON public.grejanje FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update" ON public.grejanje FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public delete" ON public.grejanje FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================
-- INVESTITOR (ako postoji)
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investitor') THEN
    ALTER TABLE public.investitor ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow public read access" ON public.investitor;
    DROP POLICY IF EXISTS "Allow public insert" ON public.investitor;
    DROP POLICY IF EXISTS "Allow public update" ON public.investitor;
    DROP POLICY IF EXISTS "Allow public delete" ON public.investitor;
    CREATE POLICY "Allow public read access" ON public.investitor FOR SELECT USING (true);
    CREATE POLICY "Allow public insert" ON public.investitor FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update" ON public.investitor FOR UPDATE USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public delete" ON public.investitor FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================
-- PROVERA - Lista svih tabela sa RLS statusom
-- ============================================
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- TEST - Proveri da li ponude rade
-- ============================================
SELECT COUNT(*) as total_ponuda FROM public.ponuda;
SELECT COUNT(*) as total_traznja FROM public.traznja;
