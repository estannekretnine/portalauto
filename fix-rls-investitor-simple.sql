-- SQL skripta za rešavanje RLS problema za tabelu investitor - JEDNOSTAVNA VERZIJA
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- 1. ISKLJUČI RLS privremeno (za testiranje)
ALTER TABLE public.investitor DISABLE ROW LEVEL SECURITY;

-- 2. Obriši SVE postojeće politike
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'investitor') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.investitor';
    END LOOP;
END $$;

-- 3. UKLJUČI RLS ponovo
ALTER TABLE public.investitor ENABLE ROW LEVEL SECURITY;

-- 4. Kreiraj jednostavne politike koje dozvoljavaju sve
CREATE POLICY "Allow all operations" ON public.investitor
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Proveri da li sada možemo da vidimo investitore
SELECT COUNT(*) as total_investitori FROM public.investitor;

-- 6. Proveri politike
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'investitor'
ORDER BY policyname;
