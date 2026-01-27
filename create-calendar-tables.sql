-- Kreiranje tabele za događaje u kalendaru
CREATE TABLE IF NOT EXISTS dogadjaji (
  id SERIAL PRIMARY KEY,
  naslov VARCHAR(255) NOT NULL,
  opis TEXT,
  pocetak TIMESTAMPTZ NOT NULL,
  kraj TIMESTAMPTZ NOT NULL,
  ceo_dan BOOLEAN DEFAULT false,
  tip VARCHAR(50) NOT NULL DEFAULT 'ostalo', -- 'poziv', 'teren', 'sastanak', 'ostalo'
  boja VARCHAR(20),
  
  -- Veze sa drugim tabelama
  idponude INTEGER REFERENCES ponuda(id) ON DELETE SET NULL,
  idtraznja INTEGER REFERENCES traznja(id) ON DELETE SET NULL,
  idpoziv INTEGER REFERENCES pozivi(id) ON DELETE SET NULL,
  idteren INTEGER REFERENCES tereni(id) ON DELETE SET NULL,
  idvlasnik INTEGER REFERENCES vlasnici(id) ON DELETE SET NULL,
  
  -- Korisnik kome pripada događaj
  idkorisnik INTEGER REFERENCES korisnici(id) ON DELETE CASCADE,
  
  -- Sinhronizacija sa eksternim kalendarima
  google_event_id VARCHAR(255),
  outlook_event_id VARCHAR(255),
  
  -- Podsetnik
  podseti_pre INTEGER DEFAULT 15, -- minuti pre događaja
  
  -- Kontakt info (za brzi pristup)
  kontakt_ime VARCHAR(255),
  kontakt_telefon VARCHAR(50),
  
  -- Metapodaci
  kreirao INTEGER REFERENCES korisnici(id),
  datumkreiranja TIMESTAMPTZ DEFAULT NOW(),
  datumpromene TIMESTAMPTZ DEFAULT NOW()
);

-- Kreiranje tabele za podsetnike
CREATE TABLE IF NOT EXISTS podsetnici (
  id SERIAL PRIMARY KEY,
  iddogadjaj INTEGER REFERENCES dogadjaji(id) ON DELETE CASCADE,
  idkorisnik INTEGER REFERENCES korisnici(id) ON DELETE CASCADE,
  vreme_podsetnika TIMESTAMPTZ NOT NULL,
  poslat BOOLEAN DEFAULT false,
  tip VARCHAR(20) DEFAULT 'browser', -- 'browser', 'email'
  datumkreiranja TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksi za brže pretrage
CREATE INDEX IF NOT EXISTS idx_dogadjaji_pocetak ON dogadjaji(pocetak);
CREATE INDEX IF NOT EXISTS idx_dogadjaji_idkorisnik ON dogadjaji(idkorisnik);
CREATE INDEX IF NOT EXISTS idx_dogadjaji_tip ON dogadjaji(tip);
CREATE INDEX IF NOT EXISTS idx_dogadjaji_idvlasnik ON dogadjaji(idvlasnik);
CREATE INDEX IF NOT EXISTS idx_podsetnici_vreme ON podsetnici(vreme_podsetnika);
CREATE INDEX IF NOT EXISTS idx_podsetnici_poslat ON podsetnici(poslat);

-- RLS (Row Level Security) politike
ALTER TABLE dogadjaji ENABLE ROW LEVEL SECURITY;
ALTER TABLE podsetnici ENABLE ROW LEVEL SECURITY;

-- Politika: Korisnici mogu videti samo svoje događaje
CREATE POLICY "Korisnici vide svoje dogadjaje" ON dogadjaji
  FOR SELECT USING (true);

CREATE POLICY "Korisnici mogu kreirati dogadjaje" ON dogadjaji
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Korisnici mogu menjati svoje dogadjaje" ON dogadjaji
  FOR UPDATE USING (true);

CREATE POLICY "Korisnici mogu brisati svoje dogadjaje" ON dogadjaji
  FOR DELETE USING (true);

-- Politike za podsetnike
CREATE POLICY "Korisnici vide svoje podsetnike" ON podsetnici
  FOR SELECT USING (true);

CREATE POLICY "Korisnici mogu kreirati podsetnike" ON podsetnici
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Korisnici mogu menjati svoje podsetnike" ON podsetnici
  FOR UPDATE USING (true);

CREATE POLICY "Korisnici mogu brisati svoje podsetnike" ON podsetnici
  FOR DELETE USING (true);

-- Komentar za dokumentaciju
COMMENT ON TABLE dogadjaji IS 'Tabela za čuvanje događaja u kalendaru - pozivi, tereni, sastanci';
COMMENT ON TABLE podsetnici IS 'Tabela za čuvanje podsetnika za događaje';
COMMENT ON COLUMN dogadjaji.tip IS 'Tip događaja: poziv, teren, sastanak, ostalo';
COMMENT ON COLUMN dogadjaji.podseti_pre IS 'Broj minuta pre događaja za podsetnik';
