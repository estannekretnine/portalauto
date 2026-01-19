-- RLS politike za tabelu tereni
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

ALTER TABLE public.tereni ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.tereni;
DROP POLICY IF EXISTS "Allow public insert" ON public.tereni;
DROP POLICY IF EXISTS "Allow public update" ON public.tereni;
DROP POLICY IF EXISTS "Allow public delete" ON public.tereni;

CREATE POLICY "Allow public read access" ON public.tereni FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.tereni FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.tereni FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.tereni FOR DELETE USING (true);

-- Provera
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tereni';
