-- SQL skripta za kreiranje funkcije za AI pretragu (vektorska pretraga)
-- Pokrenite ovu skriptu u Supabase SQL Editor-u NAKON što pokrenete add-vector-extension.sql

-- Funkcija za pretragu ponuda po sličnosti vektora
CREATE OR REPLACE FUNCTION match_ponude(
  query_embedding vector(1536),
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
    1 - (p.vektor <=> query_embedding) AS similarity
  FROM ponuda p
  WHERE 
    p.vektor IS NOT NULL
    AND p.stsaktivan = true
    AND 1 - (p.vektor <=> query_embedding) > match_threshold
  ORDER BY p.vektor <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Dodeli pristup funkciji za authenticated korisnike
GRANT EXECUTE ON FUNCTION match_ponude(vector(1536), float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION match_ponude(vector(1536), float, int) TO anon;

-- Napomena:
-- <=> je operator za cosine distance u pgvector
-- 1 - distance = similarity (veća vrednost = veća sličnost)
-- match_threshold od 0.5 znači da vraćamo samo rezultate sa sličnošću > 50%
