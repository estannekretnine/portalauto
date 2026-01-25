-- RLS politike za messages tabelu (Global Chat)
-- Pokreni ovu skriptu u Supabase SQL Editor-u

-- Omogući RLS na tabeli
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Obriši postojeće politike ako postoje
DROP POLICY IF EXISTS "Anyone can read messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

-- Politika za čitanje: Svi mogu čitati poruke
CREATE POLICY "Anyone can read messages" 
ON public.messages 
FOR SELECT 
USING (true);

-- Politika za pisanje: Svi mogu slati poruke (uključujući anonimne korisnike)
-- Napomena: Aplikacija već proverava da li je korisnik ulogovan pre slanja
CREATE POLICY "Anyone can insert messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (true);

-- Opciono: Politika za brisanje sopstvenih poruka
CREATE POLICY "Users can delete own messages" 
ON public.messages 
FOR DELETE 
USING (user_id::text = auth.uid()::text OR user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Proveri da li su politike kreirane
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';
