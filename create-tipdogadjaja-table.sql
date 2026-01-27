-- Kreiranje tabele tipdogadjaja
CREATE TABLE IF NOT EXISTS tipdogadjaja (
    id SERIAL PRIMARY KEY,
    naziv VARCHAR(100) NOT NULL UNIQUE,
    boja VARCHAR(7) DEFAULT '#6B7280', -- HEX boja
    ikona VARCHAR(50) DEFAULT 'calendar', -- naziv ikone
    opis TEXT,
    aktivan BOOLEAN DEFAULT true,
    redosled INTEGER DEFAULT 0,
    datumkreiranja TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    datumpromene TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dodaj RLS polise
ALTER TABLE tipdogadjaja ENABLE ROW LEVEL SECURITY;

-- Polisa za čitanje - svi autentifikovani korisnici mogu čitati
CREATE POLICY "tipdogadjaja_select_policy" ON tipdogadjaja
    FOR SELECT TO authenticated
    USING (true);

-- Polisa za insert - svi autentifikovani korisnici mogu dodavati
CREATE POLICY "tipdogadjaja_insert_policy" ON tipdogadjaja
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Polisa za update - svi autentifikovani korisnici mogu menjati
CREATE POLICY "tipdogadjaja_update_policy" ON tipdogadjaja
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Polisa za delete - svi autentifikovani korisnici mogu brisati
CREATE POLICY "tipdogadjaja_delete_policy" ON tipdogadjaja
    FOR DELETE TO authenticated
    USING (true);

-- Ubaci početne tipove događaja
INSERT INTO tipdogadjaja (naziv, boja, ikona, opis, redosled) VALUES
    ('Poziv', '#3B82F6', 'phone', 'Telefonski poziv', 1),
    ('Teren', '#10B981', 'map', 'Obilazak terena/nekretnine', 2),
    ('Sastanak', '#8B5CF6', 'users', 'Poslovni sastanak', 3)
ON CONFLICT (naziv) DO NOTHING;

-- Dodaj kolonu idtipdogadjaja u tabelu dogadjaji ako ne postoji
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'dogadjaji' AND column_name = 'idtipdogadjaja') THEN
        ALTER TABLE dogadjaji ADD COLUMN idtipdogadjaja INTEGER REFERENCES tipdogadjaja(id);
    END IF;
END $$;

-- Ažuriraj postojeće događaje na osnovu kolone 'tip'
UPDATE dogadjaji d
SET idtipdogadjaja = t.id
FROM tipdogadjaja t
WHERE LOWER(d.tip) = LOWER(t.naziv)
AND d.idtipdogadjaja IS NULL;
