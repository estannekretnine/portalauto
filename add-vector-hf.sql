-- SQL skripta za dodavanje Hugging Face vektora (384 dimenzije)
-- Koristi besplatni model: sentence-transformers/all-MiniLM-L6-v2
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- 1. Dodaj novu kolonu za Hugging Face embeddings (384 dimenzije)
ALTER TABLE ponuda ADD COLUMN IF NOT EXISTS vektor_hf vector(384);

-- 2. Kreiraj indeks za brzu vektorsku pretragu
CREATE INDEX IF NOT EXISTS ponuda_vektor_hf_idx 
ON ponuda USING ivfflat (vektor_hf vector_cosine_ops) 
WITH (lists = 100);

-- 3. Funkcija za pretragu ponuda po sličnosti HF vektora
CREATE OR REPLACE FUNCTION match_ponude_hf(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id bigint,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    1 - (p.vektor_hf <=> query_embedding) AS similarity
  FROM ponuda p
  WHERE 
    p.vektor_hf IS NOT NULL
    AND p.stsaktivan = true
    AND 1 - (p.vektor_hf <=> query_embedding) > match_threshold
  ORDER BY p.vektor_hf <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Dodeli pristup funkciji za authenticated korisnike
GRANT EXECUTE ON FUNCTION match_ponude_hf(vector(384), float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION match_ponude_hf(vector(384), float, int) TO anon;

-- Napomena:
-- <=> je operator za cosine distance u pgvector
-- 1 - distance = similarity (veća vrednost = veća sličnost)
-- match_threshold od 0.5 znači da vraćamo samo rezultate sa sličnošću > 50%
-- 
-- Hugging Face model: sentence-transformers/all-MiniLM-L6-v2
-- - Besplatan za korišćenje preko Inference API
-- - 384 dimenzije (manje od OpenAI-jevih 1536)
-- - Odličan kvalitet za semantičku pretragu
-- - Podržava višejezični tekst
