-- SQL skripta za postavljanje RLS politika za tabelu mediji
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- Omogući RLS za mediji tabelu
ALTER TABLE public.mediji ENABLE ROW LEVEL SECURITY;

-- Obriši postojeće politike ako postoje
DROP POLICY IF EXISTS "Svi mogu citati medije" ON public.mediji;
DROP POLICY IF EXISTS "Svi mogu dodati medije" ON public.mediji;
DROP POLICY IF EXISTS "Svi mogu menjati medije" ON public.mediji;
DROP POLICY IF EXISTS "Svi mogu brisati medije" ON public.mediji;
DROP POLICY IF EXISTS "Allow public read access" ON public.mediji;
DROP POLICY IF EXISTS "Allow public insert" ON public.mediji;
DROP POLICY IF EXISTS "Allow public update" ON public.mediji;
DROP POLICY IF EXISTS "Allow public delete" ON public.mediji;

-- Politika za čitanje - svi mogu čitati
CREATE POLICY "Allow public read access" ON public.mediji
    FOR SELECT
    USING (true);

-- Politika za insert - svi mogu dodavati
CREATE POLICY "Allow public insert" ON public.mediji
    FOR INSERT
    WITH CHECK (true);

-- Politika za update - svi mogu menjati
CREATE POLICY "Allow public update" ON public.mediji
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Politika za delete - svi mogu brisati
CREATE POLICY "Allow public delete" ON public.mediji
    FOR DELETE
    USING (true);

-- Proveri kreirane politike
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename = 'mediji'
ORDER BY policyname;
