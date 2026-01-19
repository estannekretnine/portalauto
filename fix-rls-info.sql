-- Omogući RLS za info tabelu
ALTER TABLE public.info ENABLE ROW LEVEL SECURITY;

-- Obriši postojeće politike ako postoje
DROP POLICY IF EXISTS "Svi mogu citati info" ON public.info;
DROP POLICY IF EXISTS "Admin moze dodati info" ON public.info;
DROP POLICY IF EXISTS "Admin moze menjati info" ON public.info;
DROP POLICY IF EXISTS "Admin moze brisati info" ON public.info;
DROP POLICY IF EXISTS "Allow public read access" ON public.info;
DROP POLICY IF EXISTS "Allow public insert" ON public.info;
DROP POLICY IF EXISTS "Allow public update" ON public.info;
DROP POLICY IF EXISTS "Allow public delete" ON public.info;

-- Politika za čitanje - svi mogu čitati
CREATE POLICY "Allow public read access" ON public.info
    FOR SELECT
    USING (true);

-- Politika za insert - svi autentifikovani korisnici
CREATE POLICY "Allow public insert" ON public.info
    FOR INSERT
    WITH CHECK (true);

-- Politika za update - svi autentifikovani korisnici
CREATE POLICY "Allow public update" ON public.info
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Politika za delete - svi autentifikovani korisnici
CREATE POLICY "Allow public delete" ON public.info
    FOR DELETE
    USING (true);

-- Dodaj test podatke ako tabela nema podataka
INSERT INTO public.info ("Nazivfirme", adresa, pib, maticnibroj, brojuregistru)
SELECT 'GIGANT NEKRETNINE DOO', 'Beograd, Krunska 38', '105363718', '20365471', '123456'
WHERE NOT EXISTS (SELECT 1 FROM public.info);
