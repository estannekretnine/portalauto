-- SQL skripta za dodavanje vector ekstenzije za AI pretragu
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- Proveri da li postoji pgvector ekstenzija
CREATE EXTENSION IF NOT EXISTS vector;

-- Proveri da li kolona vektor postoji u tabeli ponuda
-- Ako ne postoji, dodaj je
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ponuda' 
    AND column_name = 'vektor'
  ) THEN
    ALTER TABLE public.ponuda
    ADD COLUMN vektor vector(1536); -- 1536 dimenzija za OpenAI embeddings
  END IF;
END $$;

-- Kreiraj indeks za bržu pretragu (opciono, ali preporučeno)
CREATE INDEX IF NOT EXISTS ponuda_vektor_idx 
ON public.ponuda 
USING ivfflat (vektor vector_cosine_ops)
WITH (lists = 100);

-- Napomena: 
-- - vector(1536) je za OpenAI embeddings
-- - Ako koristite drugi AI servis, prilagodite dimenzije
-- - ivfflat indeks je dobar za brzu pretragu, ali zahteva dovoljno podataka
