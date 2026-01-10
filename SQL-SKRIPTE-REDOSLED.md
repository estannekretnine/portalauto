# Redosled Pokretanja SQL Skripti

## 📋 Brzi Start - Minimalni Redosled

Za početak rada sa aplikacijom, pokrenite sledeće skripte **U TOM REDOSLEDU**:

### 1️⃣ **Osnovna struktura korisnici tabele**
```sql
-- Pokrenite: alter-korisnici-table.sql
```
- Dodaje sve potrebne kolone u tabelu `korisnici`
- Uključuje: brojmob, stsstatus, stsaktivan, datumk, datumpt, **adresa**

### 2️⃣ **Kreiranje test korisnika**
```sql
-- Pokrenite: seed.sql
```
- Kreira test korisnike: admin, marko, ana
- ILI alternativno: `create-admin.sql` (samo admin korisnik)

### 3️⃣ **RLS (Row Level Security) - Omogućavanje pristupa**
```sql
-- Pokrenite: fix-rls.sql
```
- Omogućava osnovni pristup tabelama
- **VAŽNO:** Bez ovoga nećete moći da pristupite podacima!

### 4️⃣ **Test podaci za Ponude**
```sql
-- Pokrenite: seed-ponude-test.sql
```
- Kreira 5 test oglasa sa fotografijama
- Automatski kreira sve potrebne šifarnike ako ne postoje

---

## 📝 Detaljan Opis Skripti

### **alter-korisnici-table.sql**
- **Svrha:** Dodavanje novih kolona u tabelu `korisnici`
- **Kolone:** brojmob, stsstatus, stsaktivan, datumk, datumpt, **adresa**
- **Kada:** Jednom, na početku ili kada dodajete nove kolone
- **Status:** ✅ Obavezno

### **add-adresa-korisnici.sql**
- **Svrha:** Samo dodavanje kolone `adresa`
- **Kada:** Samo ako niste pokrenuli `alter-korisnici-table.sql`
- **Status:** ⚠️ Nije potrebno ako ste pokrenuli alter-korisnici-table.sql

### **seed.sql**
- **Svrha:** Kreiranje test korisnika
- **Kreira:** admin, marko, ana korisnike
- **Status:** ✅ Preporučeno za testiranje

### **create-admin.sql**
- **Svrha:** Kreiranje samo admin korisnika
- **Kreira:** samo admin korisnik
- **Status:** ⚠️ Alternativa za seed.sql

### **fix-rls.sql**
- **Svrha:** Osnovni RLS fix - omogućava pristup tabelama
- **Status:** ✅ Obavezno - bez ovoga aplikacija neće raditi!

### **fix-rls-*.sql** (specifični)
- **fix-rls-auto.sql** - RLS za tabelu auto
- **fix-rls-vrstaobjekta.sql** - RLS za vrstaobjekta
- **fix-rls-lokalitet.sql** - RLS za lokalitet tabele
- **fix-rls-grejanje-investitor.sql** - RLS za grejanje i investitor
- **Status:** ⚠️ Po potrebi, ako imate problema sa pristupom određenim tabelama

### **seed-ponude-test.sql**
- **Svrha:** Kreiranje 5 test oglasa (ponuda) za testiranje
- **Kreira:** 
  - 5 test ponuda sa različitim podacima
  - Automatski kreira sve potrebne šifarnike (drzava, grad, opstina, lokacija, ulica, grejanje, investitor)
  - Fotografije za svaku ponudu (URL-ovi sa Unsplash)
- **Status:** ✅ Preporučeno za testiranje modula Ponude

---

## 🚀 Preporučeni Redosled (Prvi Put)

1. `alter-korisnici-table.sql` - Struktura tabele
2. `seed.sql` - Test korisnici
3. `fix-rls.sql` - Omogućavanje pristupa
4. `seed-ponude-test.sql` - Test oglasi

---

## 🔄 Ažuriranje (Nakon Promena)

Ako ste već pokrenuli osnovne skripte, samo pokrenite:

- **Za nove kolone:** `alter-korisnici-table.sql` (koristi `IF NOT EXISTS`, bezbedno je)
- **Za nove test podatke:** `seed-ponude-test.sql` (koristi `IF NOT EXISTS` logiku)

---

## ⚠️ Napomene

- Sve skripte koriste `IF NOT EXISTS` logiku gde je moguće
- Bezbedno je pokrenuti skripte više puta
- Skripte koje koriste `DO $$` blokove su najsigurnije (seed-ponude-test.sql)
- Pre pokretanja proverite da li tabele postoje u Supabase

---

## 🐛 Troubleshooting

### Problem: "column does not exist"
**Rešenje:** Pokrenite `alter-korisnici-table.sql` prvo

### Problem: "permission denied" ili "row-level security"
**Rešenje:** Pokrenite `fix-rls.sql` i povezane RLS skripte

### Problem: "foreign key constraint"
**Rešenje:** Proverite da li su sve reference tabele kreirane. `seed-ponude-test.sql` automatski kreira sve potrebne šifarnike.

---

## 📍 Gde Pokrenuti

1. Otvorite **Supabase Dashboard**
2. Idite na **SQL Editor** → **New Query**
3. Kopirajte sadržaj skripte
4. Kliknite **Run** ili `Ctrl+Enter`

---

**Poslednje ažuriranje:** Test ponude sa fotografijama dodati
