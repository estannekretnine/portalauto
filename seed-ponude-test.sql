-- SQL skripta za kreiranje 5 test oglasa (ponuda) za testiranje
-- Pokrenite ovu skriptu u Supabase SQL Editor-u
-- 
-- PREDUSLOV: Morate imati postojeće podatke u šifarnicima (drzava, grad, opstina, lokacija, ulica)
-- Skripta koristi postojeće podatke iz šifarnika

DO $$
DECLARE
  -- Varijable za 5 različitih oglasa
  vrsta_id bigint;
  korisnik_id bigint;
  grejanje_id bigint;
  investitor_id bigint;
  
  -- Podaci za oglas 1
  drzava_id_1 bigint;
  grad_id_1 bigint;
  opstina_id_1 bigint;
  lokacija_id_1 bigint;
  ulica_id_1 bigint;
  
  -- Podaci za oglas 2
  drzava_id_2 bigint;
  grad_id_2 bigint;
  opstina_id_2 bigint;
  lokacija_id_2 bigint;
  ulica_id_2 bigint;
  
  -- Podaci za oglas 3
  drzava_id_3 bigint;
  grad_id_3 bigint;
  opstina_id_3 bigint;
  lokacija_id_3 bigint;
  ulica_id_3 bigint;
  
  -- Podaci za oglas 4
  drzava_id_4 bigint;
  grad_id_4 bigint;
  opstina_id_4 bigint;
  lokacija_id_4 bigint;
  ulica_id_4 bigint;
  
  -- Podaci za oglas 5
  drzava_id_5 bigint;
  grad_id_5 bigint;
  opstina_id_5 bigint;
  lokacija_id_5 bigint;
  ulica_id_5 bigint;
  
  ponuda_id bigint;
BEGIN
  -- Uzmi prvog korisnika (mora postojati)
  SELECT id INTO korisnik_id FROM korisnici WHERE stsaktivan = 'da' LIMIT 1;
  IF korisnik_id IS NULL THEN
    RAISE EXCEPTION 'Nema aktivnih korisnika. Pokrenite prvo seed.sql';
  END IF;

  -- Uzmi prvu vrstu objekta (mora postojati)
  SELECT id INTO vrsta_id FROM vrstaobjekta LIMIT 1;
  IF vrsta_id IS NULL THEN
    RAISE EXCEPTION 'Nema vrsta objekata. Kreirajte prvo vrstu objekta.';
  END IF;

  -- Uzmi prvo grejanje (mora postojati)
  SELECT id INTO grejanje_id FROM grejanje LIMIT 1;
  IF grejanje_id IS NULL THEN
    RAISE EXCEPTION 'Nema grejanja. Kreirajte prvo grejanje.';
  END IF;

  -- Uzmi prvog investitora (opciono)
  SELECT id INTO investitor_id FROM investitor LIMIT 1;

  -- Uzmi postojeće podatke za 5 različitih oglasa
  -- Oglas 1 - prvi red iz svakog šifarnika
  SELECT id INTO drzava_id_1 FROM drzava ORDER BY id LIMIT 1;
  SELECT id INTO grad_id_1 FROM grad WHERE iddrzava = drzava_id_1 ORDER BY id LIMIT 1;
  SELECT id INTO opstina_id_1 FROM opstina WHERE idgrad = grad_id_1 ORDER BY id LIMIT 1;
  SELECT id INTO lokacija_id_1 FROM lokacija WHERE idopstina = opstina_id_1 ORDER BY id LIMIT 1;
  SELECT id INTO ulica_id_1 FROM ulica WHERE idlokacija = lokacija_id_1 ORDER BY id LIMIT 1;

  -- Oglas 2 - drugi red (ili prvi ako nema drugog)
  SELECT id INTO drzava_id_2 FROM drzava ORDER BY id LIMIT 1 OFFSET 1;
  IF drzava_id_2 IS NULL THEN
    drzava_id_2 := drzava_id_1;
  END IF;
  SELECT id INTO grad_id_2 FROM grad WHERE iddrzava = drzava_id_2 ORDER BY id LIMIT 1 OFFSET 1;
  IF grad_id_2 IS NULL THEN
    SELECT id INTO grad_id_2 FROM grad WHERE iddrzava = drzava_id_2 ORDER BY id LIMIT 1;
  END IF;
  SELECT id INTO opstina_id_2 FROM opstina WHERE idgrad = grad_id_2 ORDER BY id LIMIT 1 OFFSET 1;
  IF opstina_id_2 IS NULL THEN
    SELECT id INTO opstina_id_2 FROM opstina WHERE idgrad = grad_id_2 ORDER BY id LIMIT 1;
  END IF;
  SELECT id INTO lokacija_id_2 FROM lokacija WHERE idopstina = opstina_id_2 ORDER BY id LIMIT 1 OFFSET 1;
  IF lokacija_id_2 IS NULL THEN
    SELECT id INTO lokacija_id_2 FROM lokacija WHERE idopstina = opstina_id_2 ORDER BY id LIMIT 1;
  END IF;
  SELECT id INTO ulica_id_2 FROM ulica WHERE idlokacija = lokacija_id_2 ORDER BY id LIMIT 1 OFFSET 1;
  IF ulica_id_2 IS NULL THEN
    SELECT id INTO ulica_id_2 FROM ulica WHERE idlokacija = lokacija_id_2 ORDER BY id LIMIT 1;
  END IF;

  -- Oglas 3 - treći red (ili kombinacija)
  drzava_id_3 := drzava_id_1;
  grad_id_3 := grad_id_1;
  SELECT id INTO opstina_id_3 FROM opstina WHERE idgrad = grad_id_3 ORDER BY id LIMIT 1 OFFSET 2;
  IF opstina_id_3 IS NULL THEN
    SELECT id INTO opstina_id_3 FROM opstina WHERE idgrad = grad_id_3 ORDER BY id LIMIT 1;
  END IF;
  SELECT id INTO lokacija_id_3 FROM lokacija WHERE idopstina = opstina_id_3 ORDER BY id LIMIT 1 OFFSET 1;
  IF lokacija_id_3 IS NULL THEN
    SELECT id INTO lokacija_id_3 FROM lokacija WHERE idopstina = opstina_id_3 ORDER BY id LIMIT 1;
  END IF;
  SELECT id INTO ulica_id_3 FROM ulica WHERE idlokacija = lokacija_id_3 ORDER BY id LIMIT 1 OFFSET 1;
  IF ulica_id_3 IS NULL THEN
    SELECT id INTO ulica_id_3 FROM ulica WHERE idlokacija = lokacija_id_3 ORDER BY id LIMIT 1;
  END IF;

  -- Oglas 4 - četvrti red (ili kombinacija)
  drzava_id_4 := drzava_id_1;
  grad_id_4 := grad_id_1;
  opstina_id_4 := opstina_id_1;
  SELECT id INTO lokacija_id_4 FROM lokacija WHERE idopstina = opstina_id_4 ORDER BY id LIMIT 1 OFFSET 2;
  IF lokacija_id_4 IS NULL THEN
    SELECT id INTO lokacija_id_4 FROM lokacija WHERE idopstina = opstina_id_4 ORDER BY id LIMIT 1;
  END IF;
  SELECT id INTO ulica_id_4 FROM ulica WHERE idlokacija = lokacija_id_4 ORDER BY id LIMIT 1 OFFSET 1;
  IF ulica_id_4 IS NULL THEN
    SELECT id INTO ulica_id_4 FROM ulica WHERE idlokacija = lokacija_id_4 ORDER BY id LIMIT 1;
  END IF;

  -- Oglas 5 - peti red (ili kombinacija)
  drzava_id_5 := drzava_id_1;
  grad_id_5 := grad_id_1;
  opstina_id_5 := opstina_id_1;
  lokacija_id_5 := lokacija_id_1;
  SELECT id INTO ulica_id_5 FROM ulica WHERE idlokacija = lokacija_id_5 ORDER BY id LIMIT 1 OFFSET 2;
  IF ulica_id_5 IS NULL THEN
    SELECT id INTO ulica_id_5 FROM ulica WHERE idlokacija = lokacija_id_5 ORDER BY id LIMIT 1 OFFSET 1;
  END IF;
  IF ulica_id_5 IS NULL THEN
    ulica_id_5 := ulica_id_1;
  END IF;

  -- Proveri da li imamo dovoljno podataka
  IF drzava_id_1 IS NULL OR ulica_id_1 IS NULL THEN
    RAISE EXCEPTION 'Nema dovoljno podataka u šifarnicima. Proverite da li postoje: drzava, grad, opstina, lokacija, ulica';
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
    ulica_id_1,
    drzava_id_1,
    grad_id_1,
    opstina_id_1,
    lokacija_id_1,
    'Modern stan u centru',
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
    ulica_id_2,
    drzava_id_2,
    grad_id_2,
    opstina_id_2,
    lokacija_id_2,
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
    ulica_id_3,
    drzava_id_3,
    grad_id_3,
    opstina_id_3,
    lokacija_id_3,
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
    ulica_id_4,
    drzava_id_4,
    grad_id_4,
    opstina_id_4,
    lokacija_id_4,
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
    ulica_id_5,
    drzava_id_5,
    grad_id_5,
    opstina_id_5,
    lokacija_id_5,
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
