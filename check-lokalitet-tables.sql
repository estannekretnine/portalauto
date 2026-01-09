-- SQL skripta za proveru strukture tabela za lokalitet
-- Pokrenite ovu skriptu u Supabase SQL Editor-u da vidite strukturu tabela

-- 1. Proveri strukturu tabele drzava
SELECT 
  'drzava' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'drzava'
ORDER BY ordinal_position;

-- 2. Proveri strukturu tabele grad
SELECT 
  'grad' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'grad'
ORDER BY ordinal_position;

-- 3. Proveri strukturu tabele opstina
SELECT 
  'opstina' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'opstina'
ORDER BY ordinal_position;

-- 4. Proveri strukturu tabele lokacija
SELECT 
  'lokacija' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'lokacija'
ORDER BY ordinal_position;

-- 5. Proveri strukturu tabele ulica
SELECT 
  'ulica' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ulica'
ORDER BY ordinal_position;

-- 6. Proveri foreign key constraint-e (referencijalni integritet)
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('drzava', 'grad', 'opstina', 'lokacija', 'ulica')
ORDER BY tc.table_name, kcu.column_name;

-- 7. Proveri RLS status za sve tabele
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('drzava', 'grad', 'opstina', 'lokacija', 'ulica')
ORDER BY tablename;

-- 8. Proveri postojeće RLS politike
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename IN ('drzava', 'grad', 'opstina', 'lokacija', 'ulica')
ORDER BY tablename, policyname;
