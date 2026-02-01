-- Fix RLS politike za tabelu tipdogadjaja
-- Pokreni ovu skriptu u Supabase SQL Editor-u
-- 
-- NAPOMENA: Aplikacija koristi custom auth (tabela korisnici + localStorage)
-- a ne Supabase Auth, tako da je korisnik uvek "anon" za Supabase.
-- Zato moramo dozvoliti anon korisniku sve operacije.

-- Ukloni SVE postojeće politike
DROP POLICY IF EXISTS "tipdogadjaja_select_policy" ON tipdogadjaja;
DROP POLICY IF EXISTS "tipdogadjaja_insert_policy" ON tipdogadjaja;
DROP POLICY IF EXISTS "tipdogadjaja_update_policy" ON tipdogadjaja;
DROP POLICY IF EXISTS "tipdogadjaja_delete_policy" ON tipdogadjaja;
DROP POLICY IF EXISTS "tipdogadjaja_select_all" ON tipdogadjaja;
DROP POLICY IF EXISTS "tipdogadjaja_insert_auth" ON tipdogadjaja;
DROP POLICY IF EXISTS "tipdogadjaja_update_auth" ON tipdogadjaja;
DROP POLICY IF EXISTS "tipdogadjaja_delete_auth" ON tipdogadjaja;
DROP POLICY IF EXISTS "Enable read access for all users" ON tipdogadjaja;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tipdogadjaja;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON tipdogadjaja;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON tipdogadjaja;

-- Osiguraj da je RLS omogućen
ALTER TABLE tipdogadjaja ENABLE ROW LEVEL SECURITY;

-- Polisa za SVE operacije - dozvoljavamo sve jer koristimo custom auth
CREATE POLICY "tipdogadjaja_allow_all" ON tipdogadjaja
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Proveri politike
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'tipdogadjaja';

-- Proveri podatke
SELECT * FROM tipdogadjaja ORDER BY redosled;
