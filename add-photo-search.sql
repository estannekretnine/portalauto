-- SQL skripta za pretragu po AI opisima fotografija
-- Omogućava pretragu ponuda na osnovu opisa fotografija
-- Pokrenite ovu skriptu u Supabase SQL Editor-u

-- 1. Dodaj kolonu za vektor opisa fotografije (384 dimenzije - HF model)
ALTER TABLE ponudafoto ADD COLUMN IF NOT EXISTS vektor_opisa vector(384);

-- 2. Kreiraj indeks za brzu vektorsku pretragu fotografija
CREATE INDEX IF NOT EXISTS ponudafoto_vektor_opisa_idx 
ON ponudafoto USING ivfflat (vektor_opisa vector_cosine_ops) 
WITH (lists = 100);

-- 3. Funkcija za pretragu ponuda po opisima fotografija
-- Vraća ponude čije fotografije imaju sličan opis
CREATE OR REPLACE FUNCTION match_ponude_by_photos(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id bigint,
  similarity float,
  photo_id bigint,
  photo_description text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (p.id)
    p.id,
    1 - (pf.vektor_opisa <=> query_embedding) AS similarity,
    pf.id AS photo_id,
    pf.opisfoto->>'ai_opis' AS photo_description
  FROM ponuda p
  INNER JOIN ponudafoto pf ON pf.idponude = p.id
  WHERE 
    pf.vektor_opisa IS NOT NULL
    AND p.stsaktivan = true
    AND 1 - (pf.vektor_opisa <=> query_embedding) > match_threshold
  ORDER BY p.id, pf.vektor_opisa <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Funkcija za kombinovanu pretragu (ponuda + fotografije)
-- Pretražuje i opise ponuda i opise fotografija
CREATE OR REPLACE FUNCTION match_ponude_combined(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id bigint,
  similarity float,
  match_source text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Pretraga po vektoru ponude
  SELECT 
    p.id,
    1 - (p.vektor_hf <=> query_embedding) AS similarity,
    'ponuda'::text AS match_source
  FROM ponuda p
  WHERE 
    p.vektor_hf IS NOT NULL
    AND p.stsaktivan = true
    AND 1 - (p.vektor_hf <=> query_embedding) > match_threshold
  
  UNION ALL
  
  -- Pretraga po opisima fotografija
  SELECT DISTINCT ON (p.id)
    p.id,
    1 - (pf.vektor_opisa <=> query_embedding) AS similarity,
    'fotografija'::text AS match_source
  FROM ponuda p
  INNER JOIN ponudafoto pf ON pf.idponude = p.id
  WHERE 
    pf.vektor_opisa IS NOT NULL
    AND p.stsaktivan = true
    AND 1 - (pf.vektor_opisa <=> query_embedding) > match_threshold
  
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 5. Dodeli pristup funkcijama
GRANT EXECUTE ON FUNCTION match_ponude_by_photos(vector(384), float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION match_ponude_by_photos(vector(384), float, int) TO anon;

GRANT EXECUTE ON FUNCTION match_ponude_combined(vector(384), float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION match_ponude_combined(vector(384), float, int) TO anon;

-- Napomena:
-- match_ponude_by_photos - pretražuje samo po opisima fotografija
-- match_ponude_combined - pretražuje i po ponudama i po fotografijama
-- 
-- Za generisanje vektora opisa fotografija, koristite Hugging Face API
-- sa modelom sentence-transformers/all-MiniLM-L6-v2
-- 
-- Primer upita: "stan sa pogledom na reku" će pronaći ponude
-- čije fotografije imaju AI opis koji pominje pogled na reku
