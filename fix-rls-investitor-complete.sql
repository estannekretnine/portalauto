-- Kompletan SQL skript za rešavanje problema sa RLS za investitor tabelu
-- Pokreni ovaj skript u Supabase SQL Editor-u

-- 1. Ukloni sve postojeće RLS politike za investitor tabelu
DROP POLICY IF EXISTS "Enable read access for all users" ON public.investitor;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.investitor;
DROP POLICY IF EXISTS "Enable update for all users" ON public.investitor;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.investitor;

-- 2. Ukloni RLS ako je već aktiviran (opciono - samo ako želiš potpuno da isključiš RLS)
-- ALTER TABLE public.investitor DISABLE ROW LEVEL SECURITY;

-- 3. Omogući RLS
ALTER TABLE public.investitor ENABLE ROW LEVEL SECURITY;

-- 4. Kreiraj nove RLS politike koje dozvoljavaju svim korisnicima pristup

-- Politika za SELECT (čitanie)
CREATE POLICY "Enable read access for all users"
ON public.investitor
FOR SELECT
USING (true);

-- Politika za INSERT (dodavanje)
CREATE POLICY "Enable insert for all users"
ON public.investitor
FOR INSERT
WITH CHECK (true);

-- Politika za UPDATE (izmena)
CREATE POLICY "Enable update for all users"
ON public.investitor
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Politika za DELETE (brisanje)
CREATE POLICY "Enable delete for all users"
ON public.investitor
FOR DELETE
USING (true);

-- Provera: Izvrši SELECT da vidiš da li radi
-- SELECT * FROM public.investitor ORDER BY opis;
