-- RLS pravila za tabelu traznja
-- Omogućava CRUD operacije za sve korisnike (uključujući anon)

-- Omogući RLS na tabeli
ALTER TABLE public.traznja ENABLE ROW LEVEL SECURITY;

-- Obriši postojeća pravila ako postoje
DROP POLICY IF EXISTS "Omogući čitanje tražnji za sve" ON public.traznja;
DROP POLICY IF EXISTS "Omogući kreiranje tražnji za autentifikovane" ON public.traznja;
DROP POLICY IF EXISTS "Omogući ažuriranje tražnji za autentifikovane" ON public.traznja;
DROP POLICY IF EXISTS "Omogući brisanje tražnji za autentifikovane" ON public.traznja;
DROP POLICY IF EXISTS "Omogući kreiranje tražnji za anon" ON public.traznja;
DROP POLICY IF EXISTS "Omogući ažuriranje tražnji za anon" ON public.traznja;
DROP POLICY IF EXISTS "Omogući brisanje tražnji za anon" ON public.traznja;
DROP POLICY IF EXISTS "Allow all operations on traznja" ON public.traznja;

-- JEDNOSTAVNO REŠENJE: Dozvoli sve operacije za sve
CREATE POLICY "Allow all operations on traznja"
ON public.traznja
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Alternativno, ako gore ne radi, probajte ova pojedinačna pravila:

-- Pravilo za čitanje (SELECT) - svi mogu da čitaju
CREATE POLICY "Omogući čitanje tražnji za sve"
ON public.traznja
FOR SELECT
TO public
USING (true);

-- Pravilo za kreiranje (INSERT) - svi mogu da kreiraju
CREATE POLICY "Omogući kreiranje tražnji za sve"
ON public.traznja
FOR INSERT
TO public
WITH CHECK (true);

-- Pravilo za ažuriranje (UPDATE) - svi mogu da ažuriraju
CREATE POLICY "Omogući ažuriranje tražnji za sve"
ON public.traznja
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Pravilo za brisanje (DELETE) - svi mogu da brišu
CREATE POLICY "Omogući brisanje tražnji za sve"
ON public.traznja
FOR DELETE
TO public
USING (true);

-- Prikaži trenutne RLS politike
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'traznja';
