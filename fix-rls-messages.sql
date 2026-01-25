-- RLS politike za messages tabelu (Global Chat)
-- Pokreni ovu skriptu u Supabase SQL Editor-u

-- ============================================================
-- 1. PRVO: Ukloni FOREIGN KEY constraint koji blokira insert
-- ============================================================
-- Tvoja messages tabela ima FK na auth.users, ali ti koristiš custom auth
-- Moramo ukloniti taj constraint

ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_user_id_fkey;

-- ============================================================
-- 2. Omogući RLS na tabeli
-- ============================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Obriši SVE postojeće politike
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.messages;

-- ============================================================
-- 4. Kreiraj nove politike
-- ============================================================

-- Politika za čitanje: Svi mogu čitati poruke
CREATE POLICY "Anyone can read messages" 
ON public.messages 
FOR SELECT 
USING (true);

-- Politika za pisanje: Svi mogu slati poruke
CREATE POLICY "Anyone can insert messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (true);

-- Politika za brisanje: Svi mogu brisati (admin će kontrolisati kroz app)
CREATE POLICY "Anyone can delete messages" 
ON public.messages 
FOR DELETE 
USING (true);

-- ============================================================
-- 5. Proveri da li su politike kreirane
-- ============================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';

-- ============================================================
-- 6. Testiraj insert
-- ============================================================
-- INSERT INTO messages (text, user_email, role) 
-- VALUES ('Test poruka', 'test@test.com', 'kupac');
-- 
-- SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;
