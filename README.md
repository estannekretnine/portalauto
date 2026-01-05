# Auto Dashboard

Aplikacija za upravljanje automobilima sa autentifikacijom i upload-om fotografija.

## Funkcionalnosti

- ✅ Login sa email i password
- ✅ Upload više fotografija odjednom
- ✅ Editovanje pojedinačnih fotografija
- ✅ Dodavanje opisa za svaku fotografiju
- ✅ CRUD operacije za automobile
- ✅ Čuvanje fotografija u JSON formatu (base64) u `foto` polju

## Instalacija

1. Instaliraj dependencies:
```bash
npm install
```

2. Kreiraj `.env` fajl sa Supabase varijablama (već je kreiran sa osnovnim vrednostima)

3. Seeduj bazu sa 2 korisnika:
   - Otvori browser konzolu na stranici
   - Pokreni: `window.seedDatabase()` (dodaj script u App.jsx za development)

## Korisnici za testiranje

1. **Marko Petrović**
   - Email: `marko@example.com`
   - Password: `marko123`

2. **Ana Jovanović**
   - Email: `ana@example.com`
   - Password: `ana123`

## Pokretanje

```bash
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:5173`

## Struktura baze

### Tabela `korisnici`
- `id` (bigint, primary key)
- `naziv` (varchar)
- `email` (varchar)
- `password` (varchar)

### Tabela `auto`
- `id` (bigint, primary key, foreign key -> korisnici.id)
- `proizvodjac` (varchar)
- `marka` (varchar)
- `presao` (numeric)
- `godiste` (numeric)
- `foto` (jsonb) - niz objekata sa `{id, url, opis}`

## Napomene

- Fotografije se čuvaju kao base64 stringovi u JSON formatu
- Svaka fotografija može imati opis
- Možete upload-ovati više fotografija odjednom
- Možete editovati pojedinačne fotografije
- Baza `auto` je inicijalno prazna

