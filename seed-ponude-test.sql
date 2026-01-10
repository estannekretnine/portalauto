-- SQL skripta za kreiranje 5 test oglasa (ponuda) za testiranje
-- Pokrenite ovu skriptu u Supabase SQL Editor-u
-- 
-- PREDUSLOV: Morate imati kreirane šifarnike (vrstaobjekta, opstina, lokacija, ulica, grejanje, investitor, korisnici)

-- Proveri da li postoje potrebni šifarnici, ako ne postoje kreiraj osnovne
DO $$
DECLARE
  vrsta_id bigint;
  opstina_id bigint;
  lokacija_id bigint;
  ulica_id bigint;
  grejanje_id bigint;
  investitor_id bigint;
  korisnik_id bigint;
  ponuda_id bigint;
BEGIN
  -- Uzmi ili kreiraj prvog korisnika
  SELECT id INTO korisnik_id FROM korisnici LIMIT 1;
  IF korisnik_id IS NULL THEN
    INSERT INTO korisnici (naziv, email, password, stsaktivan, stsstatus)
    VALUES ('Test Korisnik', 'test@example.com', 'test123', 'da', 'agent')
    RETURNING id INTO korisnik_id;
  END IF;

  -- Uzmi ili kreiraj vrstu objekta
  SELECT id INTO vrsta_id FROM vrstaobjekta LIMIT 1;
  IF vrsta_id IS NULL THEN
    INSERT INTO vrstaobjekta (opis) VALUES ('Stan') RETURNING id INTO vrsta_id;
  END IF;

  -- Uzmi ili kreiraj opštinu
  SELECT id INTO opstina_id FROM opstina LIMIT 1;
  IF opstina_id IS NULL THEN
    -- Prvo proveri da li postoji grad
    DECLARE
      grad_id bigint;
    BEGIN
      SELECT id INTO grad_id FROM grad LIMIT 1;
      IF grad_id IS NULL THEN
        SELECT id INTO grad_id FROM drzava LIMIT 1;
        IF grad_id IS NULL THEN
          INSERT INTO drzava (opis) VALUES ('Srbija') RETURNING id INTO grad_id;
        END IF;
        INSERT INTO grad (opis, iddrzava) VALUES ('Beograd', grad_id) RETURNING id INTO grad_id;
      END IF;
      INSERT INTO opstina (opis, idgrad) VALUES ('Vračar', grad_id) RETURNING id INTO opstina_id;
    END;
  END IF;

  -- Uzmi ili kreiraj lokaciju
  SELECT id INTO lokacija_id FROM lokacija LIMIT 1;
  IF lokacija_id IS NULL THEN
    INSERT INTO lokacija (opis, idopstina) VALUES ('Centar', opstina_id) RETURNING id INTO lokacija_id;
  END IF;

  -- Uzmi ili kreiraj ulicu
  SELECT id INTO ulica_id FROM ulica LIMIT 1;
  IF ulica_id IS NULL THEN
    INSERT INTO ulica (opis, idlokacija) VALUES ('Knez Mihailova', lokacija_id) RETURNING id INTO ulica_id;
  END IF;

  -- Uzmi ili kreiraj grejanje
  SELECT id INTO grejanje_id FROM grejanje LIMIT 1;
  IF grejanje_id IS NULL THEN
    INSERT INTO grejanje (opis) VALUES ('Centralno') RETURNING id INTO grejanje_id;
  END IF;

  -- Uzmi ili kreiraj investitora
  SELECT id INTO investitor_id FROM investitor LIMIT 1;
  IF investitor_id IS NULL THEN
    INSERT INTO investitor (opis) VALUES ('Test Investitor') RETURNING id INTO investitor_id;
  END IF;

  -- Kreiraj 5 test ponuda
  -- Ponuda 1: Modern stan u centru
  INSERT INTO ponuda (
    datumkreiranja,
    datumpromene,
    idvrstaobjekta,
    datumprijema,
    idkorisnika,
    idulica,
    iddrzava,
    idgrada,
    idopstina,
    idlokacija,
    naslovaoglasa,
    kontaktosoba,
    brojtelefona,
    kvadratura,
    kvadraturaizugovora,
    struktura,
    sprat,
    spratstana,
    spratnostzgrade,
    idgrejanje,
    ststelefon,
    stslift,
    stsuknjizen,
    cena,
    godinagradnje,
    stsuseljivost,
    stspodrum,
    ststoplavoda,
    stsinterfon,
    stszasebno,
    opis,
    stsaktivan,
    stsrentaprodaja,
    stsnovogradnja,
    stssalonac,
    latitude,
    longitude
  ) VALUES (
    NOW(),
    NOW(),
    vrsta_id,
    CURRENT_DATE,
    korisnik_id,
    ulica_id,
    (SELECT iddrzava FROM grad LIMIT 1),
    (SELECT id FROM grad LIMIT 1),
    opstina_id,
    lokacija_id,
    'Modern stan u centru Beograda',
    'Marko Petrovic',
    '+381 60 123 4567',
    65.5,
    58.0,
    55.0,
    '3/5',
    3,
    5,
    grejanje_id,
    true,
    true,
    true,
    85000,
    '2020',
    true,
    false,
    true,
    true,
    true,
    'Prelep stan u centru grada sa odličnom infrastrukturom. Stan je potpuno renoviran i spreman za useljenje.',
    true,
    'prodaja',
    false,
    true,
    '44.787197',
    '20.457273'
  ) RETURNING id INTO ponuda_id;

  -- Dodaj fotografije za ponudu 1
  INSERT INTO ponudafoto (datumpromene, idponude, url, opis, redosled, glavna)
  VALUES 
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'Spoljašnjost zgrade', 1, true),
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'Enterijer - dnevni boravak', 2, false),
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1560449752-5a20e74b4dd1?w=800', 'Kuhinja', 3, false);

  -- Ponuda 2: Luksuzni apartman
  INSERT INTO ponuda (
    datumkreiranja,
    datumpromene,
    idvrstaobjekta,
    datumprijema,
    idkorisnika,
    idulica,
    iddrzava,
    idgrada,
    idopstina,
    idlokacija,
    naslovaoglasa,
    kontaktosoba,
    brojtelefona,
    kvadratura,
    kvadraturaizugovora,
    struktura,
    sprat,
    spratstana,
    spratnostzgrade,
    idgrejanje,
    ststelefon,
    stslift,
    stsuknjizen,
    cena,
    godinagradnje,
    stsuseljivost,
    stspodrum,
    ststoplavoda,
    stsinterfon,
    stszasebno,
    opis,
    stsaktivan,
    stsrentaprodaja,
    stsnovogradnja,
    stssalonac,
    stslux,
    latitude,
    longitude
  ) VALUES (
    NOW(),
    NOW(),
    vrsta_id,
    CURRENT_DATE,
    korisnik_id,
    ulica_id,
    (SELECT iddrzava FROM grad LIMIT 1),
    (SELECT id FROM grad LIMIT 1),
    opstina_id,
    lokacija_id,
    'Luksuzni apartman sa panoramskim pogledom',
    'Ana Jovanovic',
    '+381 64 987 6543',
    120.0,
    110.0,
    115.0,
    '5/8',
    5,
    8,
    grejanje_id,
    true,
    true,
    true,
    250000,
    '2022',
    true,
    true,
    true,
    true,
    true,
    'Luksuzan apartman sa panoramskim pogledom na grad. Potpuno opremljen i spreman za useljenje.',
    true,
    'prodaja',
    true,
    true,
    true,
    '44.816667',
    '20.466667'
  ) RETURNING id INTO ponuda_id;

  INSERT INTO ponudafoto (datumpromene, idponude, url, opis, redosled, glavna)
  VALUES 
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800', 'Panoramski pogled', 1, true),
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', 'Modern enterijer', 2, false);

  -- Ponuda 3: Porodični dom
  INSERT INTO ponuda (
    datumkreiranja,
    datumpromene,
    idvrstaobjekta,
    datumprijema,
    idkorisnika,
    idulica,
    iddrzava,
    idgrada,
    idopstina,
    idlokacija,
    naslovaoglasa,
    kontaktosoba,
    brojtelefona,
    kvadratura,
    kvadraturaizugovora,
    struktura,
    sprat,
    spratstana,
    spratnostzgrade,
    idgrejanje,
    ststelefon,
    stslift,
    stsuknjizen,
    cena,
    godinagradnje,
    stsuseljivost,
    stspodrum,
    ststoplavoda,
    stsinterfon,
    stszasebno,
    opis,
    stsaktivan,
    stsrentaprodaja,
    stsnovogradnja,
    stssalonac,
    latitude,
    longitude
  ) VALUES (
    NOW(),
    NOW(),
    vrsta_id,
    CURRENT_DATE,
    korisnik_id,
    ulica_id,
    (SELECT iddrzava FROM grad LIMIT 1),
    (SELECT id FROM grad LIMIT 1),
    opstina_id,
    lokacija_id,
    'Prostran porodični dom sa baštom',
    'Petar Nikolic',
    '+381 61 555 8888',
    180.0,
    165.0,
    170.0,
    '2/2',
    2,
    2,
    grejanje_id,
    true,
    false,
    true,
    320000,
    '2018',
    true,
    true,
    true,
    true,
    true,
    'Prostran porodični dom sa velikom baštom. Idealno za porodicu sa decom.',
    true,
    'prodaja',
    false,
    false,
    '44.790000',
    '20.470000'
  ) RETURNING id INTO ponuda_id;

  INSERT INTO ponudafoto (datumpromene, idponude, url, opis, redosled, glavna)
  VALUES 
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', 'Spoljašnjost kuće', 1, true),
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', 'Bašta', 2, false);

  -- Ponuda 4: Studio apartman
  INSERT INTO ponuda (
    datumkreiranja,
    datumpromene,
    idvrstaobjekta,
    datumprijema,
    idkorisnika,
    idulica,
    iddrzava,
    idgrada,
    idopstina,
    idlokacija,
    naslovaoglasa,
    kontaktosoba,
    brojtelefona,
    kvadratura,
    kvadraturaizugovora,
    struktura,
    sprat,
    spratstana,
    spratnostzgrade,
    idgrejanje,
    ststelefon,
    stslift,
    stsuknjizen,
    cena,
    godinagradnje,
    stsuseljivost,
    stspodrum,
    ststoplavoda,
    stsinterfon,
    stszasebno,
    opis,
    stsaktivan,
    stsrentaprodaja,
    stsnovogradnja,
    stssalonac,
    latitude,
    longitude
  ) VALUES (
    NOW(),
    NOW(),
    vrsta_id,
    CURRENT_DATE,
    korisnik_id,
    ulica_id,
    (SELECT iddrzava FROM grad LIMIT 1),
    (SELECT id FROM grad LIMIT 1),
    opstina_id,
    lokacija_id,
    'Komforan studio apartman',
    'Jovana Markovic',
    '+381 62 777 9999',
    35.0,
    32.0,
    30.0,
    '1/4',
    1,
    4,
    grejanje_id,
    true,
    true,
    true,
    45000,
    '2019',
    true,
    false,
    false,
    true,
    true,
    'Komforan studio apartman u mirnoj ulici. Idealno za studente ili mlade parove.',
    true,
    'prodaja',
    false,
    false,
    '44.785000',
    '20.455000'
  ) RETURNING id INTO ponuda_id;

  INSERT INTO ponudafoto (datumpromene, idponude, url, opis, redosled, glavna)
  VALUES 
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'Studio enterijer', 1, true);

  -- Ponuda 5: Penthouse
  INSERT INTO ponuda (
    datumkreiranja,
    datumpromene,
    idvrstaobjekta,
    datumprijema,
    idkorisnika,
    idulica,
    iddrzava,
    idgrada,
    idopstina,
    idlokacija,
    naslovaoglasa,
    kontaktosoba,
    brojtelefona,
    kvadratura,
    kvadraturaizugovora,
    struktura,
    sprat,
    spratstana,
    spratnostzgrade,
    idgrejanje,
    ststelefon,
    stslift,
    stsuknjizen,
    cena,
    godinagradnje,
    stsuseljivost,
    stspodrum,
    ststoplavoda,
    stsinterfon,
    stszasebno,
    stsdupleks,
    opis,
    stsaktivan,
    stsrentaprodaja,
    stsnovogradnja,
    stssalonac,
    stslux,
    stsekskluziva,
    latitude,
    longitude,
    idinvestitor
  ) VALUES (
    NOW(),
    NOW(),
    vrsta_id,
    CURRENT_DATE,
    korisnik_id,
    ulica_id,
    (SELECT iddrzava FROM grad LIMIT 1),
    (SELECT id FROM grad LIMIT 1),
    opstina_id,
    lokacija_id,
    'Ekskluzivni penthouse sa terasom',
    'Milos Stojanovic',
    '+381 63 111 2222',
    250.0,
    230.0,
    240.0,
    '10/10',
    10,
    10,
    grejanje_id,
    true,
    true,
    true,
    850000,
    '2023',
    true,
    true,
    true,
    true,
    true,
    true,
    'Ekskluzivni penthouse sa velikom terasom i panoramskim pogledom. Najviši standard kvaliteta.',
    true,
    'prodaja',
    true,
    true,
    true,
    true,
    '44.820000',
    '20.460000',
    investitor_id
  ) RETURNING id INTO ponuda_id;

  INSERT INTO ponudafoto (datumpromene, idponude, url, opis, redosled, glavna)
  VALUES 
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800', 'Teras sa panoramskim pogledom', 1, true),
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800', 'Luksuzan enterijer', 2, false),
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', 'Master soba', 3, false),
    (NOW(), ponuda_id, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'Kuhinja', 4, false);

  RAISE NOTICE 'Uspešno kreirano 5 test ponuda sa fotografijama!';
END $$;

-- Proveri kreirane ponude
SELECT 
  p.id,
  p.naslovaoglasa,
  p.kvadratura,
  p.cena,
  p.stsaktivan,
  p.stsrentaprodaja,
  vo.opis as vrsta_objekta,
  o.opis as opstina,
  l.opis as lokacija,
  u.opis as ulica,
  (SELECT COUNT(*) FROM ponudafoto WHERE idponude = p.id) as broj_fotografija
FROM ponuda p
LEFT JOIN vrstaobjekta vo ON p.idvrstaobjekta = vo.id
LEFT JOIN opstina o ON p.idopstina = o.id
LEFT JOIN lokacija l ON p.idlokacija = l.id
LEFT JOIN ulica u ON p.idulica = u.id
WHERE p.stsaktivan = true 
  AND p.stsrentaprodaja = 'prodaja'
ORDER BY p.id DESC
LIMIT 5;
