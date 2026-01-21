-- SQL skripta za postavljanje RLS politika za tabele vlasnici i vremetrajanja
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- ============================================
-- TABELA: vlasnici
-- ============================================

-- Omogući RLS za vlasnici tabelu
ALTER TABLE public.vlasnici ENABLE ROW LEVEL SECURITY;

-- Obriši postojeće politike ako postoje
DROP POLICY IF EXISTS "Allow public read vlasnici" ON public.vlasnici;
DROP POLICY IF EXISTS "Allow public insert vlasnici" ON public.vlasnici;
DROP POLICY IF EXISTS "Allow public update vlasnici" ON public.vlasnici;
DROP POLICY IF EXISTS "Allow public delete vlasnici" ON public.vlasnici;

-- Politika za čitanje - svi mogu čitati
CREATE POLICY "Allow public read vlasnici" ON public.vlasnici
    FOR SELECT
    USING (true);

-- Politika za insert - svi mogu dodavati
CREATE POLICY "Allow public insert vlasnici" ON public.vlasnici
    FOR INSERT
    WITH CHECK (true);

-- Politika za update - svi mogu menjati
CREATE POLICY "Allow public update vlasnici" ON public.vlasnici
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Politika za delete - svi mogu brisati
CREATE POLICY "Allow public delete vlasnici" ON public.vlasnici
    FOR DELETE
    USING (true);

-- ============================================
-- TABELA: vremetrajanja
-- ============================================

-- Omogući RLS za vremetrajanja tabelu
ALTER TABLE public.vremetrajanja ENABLE ROW LEVEL SECURITY;

-- Obriši postojeće politike ako postoje
DROP POLICY IF EXISTS "Allow public read vremetrajanja" ON public.vremetrajanja;
DROP POLICY IF EXISTS "Allow public insert vremetrajanja" ON public.vremetrajanja;
DROP POLICY IF EXISTS "Allow public update vremetrajanja" ON public.vremetrajanja;
DROP POLICY IF EXISTS "Allow public delete vremetrajanja" ON public.vremetrajanja;

-- Politika za čitanje - svi mogu čitati
CREATE POLICY "Allow public read vremetrajanja" ON public.vremetrajanja
    FOR SELECT
    USING (true);

-- Politika za insert - svi mogu dodavati
CREATE POLICY "Allow public insert vremetrajanja" ON public.vremetrajanja
    FOR INSERT
    WITH CHECK (true);

-- Politika za update - svi mogu menjati
CREATE POLICY "Allow public update vremetrajanja" ON public.vremetrajanja
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Politika za delete - svi mogu brisati
CREATE POLICY "Allow public delete vremetrajanja" ON public.vremetrajanja
    FOR DELETE
    USING (true);

-- ============================================
-- TABELA: komentar
-- ============================================

-- Omogući RLS za komentar tabelu
ALTER TABLE public.komentar ENABLE ROW LEVEL SECURITY;

-- Obriši postojeće politike ako postoje
DROP POLICY IF EXISTS "Allow public read komentar" ON public.komentar;
DROP POLICY IF EXISTS "Allow public insert komentar" ON public.komentar;
DROP POLICY IF EXISTS "Allow public update komentar" ON public.komentar;
DROP POLICY IF EXISTS "Allow public delete komentar" ON public.komentar;

-- Politika za čitanje - svi mogu čitati
CREATE POLICY "Allow public read komentar" ON public.komentar
    FOR SELECT
    USING (true);

-- Politika za insert - svi mogu dodavati
CREATE POLICY "Allow public insert komentar" ON public.komentar
    FOR INSERT
    WITH CHECK (true);

-- Politika za update - svi mogu menjati
CREATE POLICY "Allow public update komentar" ON public.komentar
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Politika za delete - svi mogu brisati
CREATE POLICY "Allow public delete komentar" ON public.komentar
    FOR DELETE
    USING (true);

-- ============================================
-- PROVERA
-- ============================================

-- Proveri kreirane politike za vlasnici
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename = 'vlasnici'
ORDER BY policyname;

-- Proveri kreirane politike za vremetrajanja
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename = 'vremetrajanja'
ORDER BY policyname;

-- Proveri kreirane politike za komentar
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename = 'komentar'
ORDER BY policyname;
