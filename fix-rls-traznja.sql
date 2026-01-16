-- RLS pravila za tabelu traznja
-- Omogućava CRUD operacije za autentifikovane korisnike

-- Omogući RLS na tabeli
ALTER TABLE public.traznja ENABLE ROW LEVEL SECURITY;

-- Obriši postojeća pravila ako postoje
DROP POLICY IF EXISTS "Omogući čitanje tražnji za sve" ON public.traznja;
DROP POLICY IF EXISTS "Omogući kreiranje tražnji za autentifikovane" ON public.traznja;
DROP POLICY IF EXISTS "Omogući ažuriranje tražnji za autentifikovane" ON public.traznja;
DROP POLICY IF EXISTS "Omogući brisanje tražnji za autentifikovane" ON public.traznja;

-- Pravilo za čitanje (SELECT) - svi mogu da čitaju
CREATE POLICY "Omogući čitanje tražnji za sve"
ON public.traznja
FOR SELECT
TO public
USING (true);

-- Pravilo za kreiranje (INSERT) - samo autentifikovani korisnici
CREATE POLICY "Omogući kreiranje tražnji za autentifikovane"
ON public.traznja
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Pravilo za ažuriranje (UPDATE) - samo autentifikovani korisnici
CREATE POLICY "Omogući ažuriranje tražnji za autentifikovane"
ON public.traznja
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Pravilo za brisanje (DELETE) - samo autentifikovani korisnici
CREATE POLICY "Omogući brisanje tražnji za autentifikovane"
ON public.traznja
FOR DELETE
TO authenticated
USING (true);

-- Ako koristite anonimne korisnike (anon role), dodajte i ova pravila:
-- CREATE POLICY "Omogući kreiranje tražnji za anon"
-- ON public.traznja
-- FOR INSERT
-- TO anon
-- WITH CHECK (true);

-- CREATE POLICY "Omogući ažuriranje tražnji za anon"
-- ON public.traznja
-- FOR UPDATE
-- TO anon
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY "Omogući brisanje tražnji za anon"
-- ON public.traznja
-- FOR DELETE
-- TO anon
-- USING (true);

-- Proveri da li vektor kolona postoji, ako ne - dodaj je
-- ALTER TABLE public.traznja ADD COLUMN IF NOT EXISTS vektor extensions.vector;

-- Kreiranje indeksa za vektor pretragu (opcionalno, za bolje performanse)
-- CREATE INDEX IF NOT EXISTS idx_traznja_vektor ON public.traznja USING ivfflat (vektor vector_cosine_ops) WITH (lists = 100);

-- Prikaži trenutne RLS politike
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'traznja';
