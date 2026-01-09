-- SQL skripta za proveru RLS statusa za tabelu vrstaobjekta
-- Pokrenite ovu skriptu u Supabase SQL Editor-u da proverite trenutno stanje

-- 1. Proveri da li RLS jeste omogućen
SELECT 
  tablename, 
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS je OMOGUĆEN'
    ELSE 'RLS je ONEMOGUĆEN'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'vrstaobjekta';

-- 2. Proveri sve postojeće politike
SELECT 
  policyname as policy_name,
  cmd as command,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    ELSE cmd::text
  END as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'vrstaobjekta'
ORDER BY policyname;

-- 3. Proveri strukturu tabele
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'vrstaobjekta'
ORDER BY ordinal_position;

-- 4. Proveri da li postoje podaci
SELECT COUNT(*) as total_records FROM public.vrstaobjekta;

-- 5. Pokušaj SELECT operacije (trebalo bi da radi ako su politike ispravno postavljene)
SELECT * FROM public.vrstaobjekta LIMIT 5;
