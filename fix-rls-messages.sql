-- RLS politike za messages tabelu (Global Chat)
-- Pokreni ovu skriptu u Supabase SQL Editor-u

-- ============================================================
-- 1. PRVO: Ukloni FOREIGN KEY constraint
-- ============================================================
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_user_id_fkey;

-- ============================================================
-- 2. PROMENI TIP KOLONE user_id iz UUID u INTEGER
-- ============================================================
-- Tvoja korisnici tabela koristi INTEGER za id, ne UUID!

-- Ako tabela ima podatke, prvo obriši stare (ili backup)
-- DELETE FROM public.messages;

-- Promeni tip kolone
ALTER TABLE public.messages 
ALTER COLUMN user_id TYPE INTEGER USING NULL;

-- ============================================================
-- 3. Omogući RLS na tabeli
-- ============================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. Obriši SVE postojeće politike
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can delete messages" ON public.messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.messages;

-- ============================================================
-- 5. Kreiraj nove politike
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
-- 6. Proveri strukturu tabele
-- ============================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages';

-- ============================================================
-- 7. Proveri politike
-- ============================================================
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'messages';

-- ============================================================
-- 8. Testiraj insert
-- ============================================================
-- INSERT INTO messages (text, user_id, user_email, role) 
-- VALUES ('Test poruka', 5, 'test@test.com', 'kupac');
-- 
-- SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;
