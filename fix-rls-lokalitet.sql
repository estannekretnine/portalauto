-- SQL skripta za postavljanje RLS politika za tabele lokaliteta
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- Funkcija za kreiranje RLS politika za tabelu
CREATE OR REPLACE FUNCTION create_rls_policies_for_table(table_name TEXT)
RETURNS void AS $$
BEGIN
  -- Omogući RLS
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  
  -- Obriši postojeće politike
  EXECUTE format('DROP POLICY IF EXISTS "Allow public read access" ON public.%I', table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Allow public insert" ON public.%I', table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Allow public update" ON public.%I', table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Allow public delete" ON public.%I', table_name);
  
  -- Kreiraj nove politike
  EXECUTE format('CREATE POLICY "Allow public read access" ON public.%I FOR SELECT USING (true)', table_name);
  EXECUTE format('CREATE POLICY "Allow public insert" ON public.%I FOR INSERT WITH CHECK (true)', table_name);
  EXECUTE format('CREATE POLICY "Allow public update" ON public.%I FOR UPDATE USING (true) WITH CHECK (true)', table_name);
  EXECUTE format('CREATE POLICY "Allow public delete" ON public.%I FOR DELETE USING (true)', table_name);
END;
$$ LANGUAGE plpgsql;

-- Kreiraj RLS politike za sve tabele lokaliteta
SELECT create_rls_policies_for_table('drzava');
SELECT create_rls_policies_for_table('grad');
SELECT create_rls_policies_for_table('opstina');
SELECT create_rls_policies_for_table('lokacija');
SELECT create_rls_policies_for_table('ulica');

-- Proveri kreirane politike
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename IN ('drzava', 'grad', 'opstina', 'lokacija', 'ulica')
ORDER BY tablename, policyname;

-- Obriši pomoćnu funkciju
DROP FUNCTION IF EXISTS create_rls_policies_for_table(TEXT);
