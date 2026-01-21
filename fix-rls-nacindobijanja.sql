-- RLS politike za tabelu vrstanacinadobijanjaoglasa
-- Izvršiti u Supabase SQL Editor-u

-- Omogući RLS na tabeli
ALTER TABLE public.vrstanacinadobijanjaoglasa ENABLE ROW LEVEL SECURITY;

-- Obriši postojeće politike ako postoje
DROP POLICY IF EXISTS "Svi korisnici mogu čitati načine dobijanja" ON public.vrstanacinadobijanjaoglasa;
DROP POLICY IF EXISTS "Autentifikovani korisnici mogu dodavati načine dobijanja" ON public.vrstanacinadobijanjaoglasa;
DROP POLICY IF EXISTS "Autentifikovani korisnici mogu ažurirati načine dobijanja" ON public.vrstanacinadobijanjaoglasa;
DROP POLICY IF EXISTS "Autentifikovani korisnici mogu brisati načine dobijanja" ON public.vrstanacinadobijanjaoglasa;

-- Politika za čitanje - svi autentifikovani korisnici mogu čitati
CREATE POLICY "Svi korisnici mogu čitati načine dobijanja"
ON public.vrstanacinadobijanjaoglasa
FOR SELECT
TO authenticated
USING (true);

-- Politika za dodavanje - svi autentifikovani korisnici mogu dodavati
CREATE POLICY "Autentifikovani korisnici mogu dodavati načine dobijanja"
ON public.vrstanacinadobijanjaoglasa
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politika za ažuriranje - svi autentifikovani korisnici mogu ažurirati
CREATE POLICY "Autentifikovani korisnici mogu ažurirati načine dobijanja"
ON public.vrstanacinadobijanjaoglasa
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Politika za brisanje - svi autentifikovani korisnici mogu brisati
CREATE POLICY "Autentifikovani korisnici mogu brisati načine dobijanja"
ON public.vrstanacinadobijanjaoglasa
FOR DELETE
TO authenticated
USING (true);

-- Provera da li su politike kreirane
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'vrstanacinadobijanjaoglasa';
