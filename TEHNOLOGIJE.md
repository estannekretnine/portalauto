# Detaljna Dokumentacija Tehnologija - Agencija za Nekretnine

## 📋 Pregled Projekta

**Naziv projekta:** React Auto Dashboard / Portal Auto  
**Tip aplikacije:** Web aplikacija za upravljanje nekretninama  
**Deployment:** Vercel (https://portalauto.vercel.app)

---

## 🛠️ Tehnološki Stack

### 1. Core Framework i Build Tool

#### **React 18.2.0**
- **Šta je:** JavaScript biblioteka za izgradnju korisničkih interfejsa
- **Za šta se koristi:**
  - Kreiranje svih UI komponenti (Login, Dashboard, PonudaForm, itd.)
  - Upravljanje stanjem aplikacije (useState, useEffect, useRef)
  - Komponentni pristup razvoju
  - Reaktivni UI koji se automatski ažurira

#### **React DOM 18.2.0**
- **Šta je:** Renderovanje React komponenti u DOM
- **Za šta se koristi:**
  - Mounting aplikacije u `main.jsx`
  - Renderovanje komponenti u browser DOM

#### **Vite 5.0.8**
- **Šta je:** Moderen build tool i development server
- **Za šta se koristi:**
  - Development server (`npm run dev`) - brzo učitavanje
  - Production build (`npm run build`) - optimizovani bundle
  - Code splitting (vendor, icons chunks) - manji bundle size
  - Hot Module Replacement (HMR) - instant ažuriranja tokom razvoja
  - Custom plugin za build info generisanje

#### **@vitejs/plugin-react 4.2.1**
- **Šta je:** Vite plugin za React podršku
- **Za šta se koristi:**
  - JSX transformacija
  - React Fast Refresh
  - Optimizacije za React aplikacije

---

### 2. Routing

#### **React Router DOM 6.21.0**
- **Šta je:** Biblioteka za routing u React aplikacijama
- **Za šta se koristi:**
  - Definicija ruta (`/` za login, `/dashboard` za glavnu stranicu)
  - Protected routes - zaštita dashboard-a za neautentifikovane korisnike
  - Navigacija između stranica
  - `useLocation` hook za SEO ažuriranja na osnovu rute

---

### 3. Baza Podataka i Backend

#### **Supabase (@supabase/supabase-js 2.39.0)**
- **Šta je:** Backend-as-a-Service (BaaS) platforma
- **Za šta se koristi:**
  - **PostgreSQL baza podataka** - čuvanje svih podataka (ponude, korisnici, lokacije)
  - **Autentifikacija korisnika** - login/logout funkcionalnost
  - **Row Level Security (RLS)** - bezbednosni mehanizam na nivou baze
  - **CRUD operacije** - Create, Read, Update, Delete za sve entitete:
    - Ponude (nekretnine)
    - Korisnici
    - Lokacije (države, gradovi, opštine, ulice)
    - Vrste objekata
    - Investitori
    - Grejanje
  - **Storage** - čuvanje fotografija nekretnina
  - **Dva klijenta:**
    - `supabase` - koristi anon key (za klijentske operacije)
    - `supabaseAdmin` - koristi service role key (za admin operacije kao što je seed)

---

### 4. Stilizovanje

#### **Tailwind CSS 3.3.6**
- **Šta je:** Utility-first CSS framework
- **Za šta se koristi:**
  - **Responsive dizajn** - mobile-first pristup
  - **Utility klase** - brzo stilizovanje bez custom CSS-a
  - **Layout sistem** - flexbox, grid, spacing
  - **Boje i teme** - konzistentan dizajn kroz aplikaciju
  - **Custom animacije** - shimmer efekat
  - **Tematizacija** - lako prilagođavanje boja

#### **PostCSS 8.4.32**
- **Šta je:** CSS procesor
- **Za šta se koristi:**
  - Procesiranje Tailwind CSS-a
  - Integracija sa Autoprefixer-om

#### **Autoprefixer 10.4.16**
- **Šta je:** Automatsko dodavanje vendor prefiksa
- **Za šta se koristi:**
  - Cross-browser kompatibilnost
  - Automatsko dodavanje `-webkit-`, `-moz-`, `-ms-` prefiksa

---

### 5. UI Komponente i Ikonice

#### **Lucide React 0.294.0**
- **Šta je:** Biblioteka modernih, optimizovanih ikonica
- **Za šta se koristi:**
  - Sve ikonice u aplikaciji:
    - Save, X, Upload, Building2, MapPin
    - DollarSign, Ruler, Info, Search
    - Users, FileText, Receipt, Wallet
    - UserCheck, Brain, Plus, Trash2
  - Tree-shaking - import samo potrebnih ikonica
  - Optimizovane SVG ikonice

---

### 6. Mape i Geolokacija

#### **Leaflet 1.9.4**
- **Šta je:** Open-source JavaScript biblioteka za interaktivne mape
- **Za šta se koristi:**
  - Prikaz mape nekretnina
  - Marker ikonice za lokacije
  - Geokodiranje adresa (Nominatim API)
  - Interaktivni markeri - klik na mapu za postavljanje koordinata

#### **React Leaflet 4.2.1**
- **Šta je:** React wrapper za Leaflet
- **Za šta se koristi:**
  - React komponente za mapu:
    - `MapContainer` - glavni kontejner mape
    - `TileLayer` - tile layer za prikaz mape
    - `Marker` - markeri za lokacije
  - Integracija sa React state-om
  - Hooks: `useMapEvents`, `useMap`
  - Interaktivni markeri za lokacije nekretnina

---

### 7. TypeScript Tipovi (Development)

#### **@types/react 18.2.43** i **@types/react-dom 18.2.17**
- **Šta je:** TypeScript definicije tipova za React
- **Za šta se koristi:**
  - IntelliSense u editoru
  - Type checking (iako je projekat u JavaScript-u)
  - Bolje autocomplete i dokumentacija u VS Code

---

### 8. Custom Plugin

#### **vite-plugin-build-info.js**
- **Šta je:** Custom Vite plugin
- **Za šta se koristi:**
  - Generisanje `build-info.json` fajla
  - Čuvanje verzije i datuma build-a
  - Prikaz build informacija u produkciji na login stranici

---

## 📁 Arhitektura Projekta

### Struktura Foldera:
```
src/
├── components/           # React komponente
│   ├── lokalitet/       # Moduli za lokacije
│   │   ├── DrzavaModule.jsx
│   │   ├── GradModule.jsx
│   │   ├── OpstinaModule.jsx
│   │   ├── LokacijaModule.jsx
│   │   └── UlicaModule.jsx
│   ├── AutoForm.jsx
│   ├── AutoModule.jsx
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── PonudaForm.jsx    # Glavna forma za nekretnine
│   ├── PonudeModule.jsx
│   ├── PhotoUpload.jsx   # Upload fotografija
│   ├── PropertyMap.jsx   # Mapa sa Leaflet
│   └── ...
├── utils/                # Helper funkcije
│   ├── auth.js          # Autentifikacija
│   ├── supabase.js      # Supabase konfiguracija
│   ├── seo.js           # SEO optimizacija
│   └── seed.js          # Seed podaci
├── App.jsx              # Glavna aplikacija sa routing-om
├── main.jsx             # Entry point
└── index.css            # Globalni stilovi
```

---

## 🎯 Glavne Funkcionalnosti

### 1. Autentifikacija
- Login sa email i password
- Supabase Auth integracija
- Protected routes
- Session management

### 2. CRUD Operacije
- **Ponude (Nekretnine):**
  - Dodavanje, izmena, brisanje
  - Kompleksna forma sa dinamičkim poljima
  - JSONB metapodaci (vlasnici, istorija cene, EOP, itd.)
  
- **Korisnici:**
  - Upravljanje korisnicima sistema
  
- **Lokacije:**
  - Hijerarhijska struktura (Država → Grad → Opština → Lokacija → Ulica)
  
- **Vrste objekata:**
  - Kategorizacija nekretnina (stan, kuća, plac, poslovni prostor)
  
- **Investitori i Grejanje:**
  - Lookup tabele za dodatne informacije

### 3. Upload Fotografija
- Višestruki upload fotografija
- Editovanje pojedinačnih fotografija
- Opisi za svaku fotografiju
- Čuvanje u Supabase Storage ili JSON formatu

### 4. Mape
- Interaktivna mapa sa Leaflet
- Geokodiranje adresa
- Postavljanje koordinata klikom na mapu
- Prikaz markera za lokacije nekretnina

### 5. SEO Optimizacija
- Dinamičko ažuriranje meta tagova
- Open Graph tagovi
- Canonical URLs
- Sitemap i robots.txt

### 6. Responsive Dizajn
- Mobile-first pristup
- Tailwind CSS responsive utilities
- Optimizovano za sve uređaje

---

## 🚀 Deployment

- **Platforma:** Vercel
- **URL:** https://portalauto.vercel.app
- **Build proces:** Vite build sa optimizacijama
- **Environment variables:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SUPABASE_SERVICE_ROLE_KEY` (opciono)

---

## 📦 Dependencies Pregled

### Production Dependencies:
- `react` & `react-dom` - UI framework
- `react-router-dom` - Routing
- `@supabase/supabase-js` - Backend i baza
- `leaflet` & `react-leaflet` - Mape
- `lucide-react` - Ikonice

### Development Dependencies:
- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin
- `tailwindcss` - CSS framework
- `postcss` & `autoprefixer` - CSS procesiranje
- `@types/react` & `@types/react-dom` - TypeScript tipovi

---

## 🔧 Konfiguracija

### Vite Config:
- Code splitting (vendor, icons)
- Custom build info plugin
- Optimizacije za production

### Tailwind Config:
- Custom animacije (shimmer)
- Content paths za purging
- Extended tema

### PostCSS Config:
- Tailwind CSS plugin
- Autoprefixer plugin

---

## 📝 Zaključak

Projekat koristi **modern React stack** sa:
- **Vite** za brz razvoj i build
- **Supabase** za kompletan backend i bazu
- **Tailwind CSS** za brzo i konzistentno stilizovanje
- **React Router** za navigaciju
- **Leaflet** za interaktivne mape

Arhitektura je **modularna i skalabilna**, sa jasnom separacijom komponenti i utility funkcija. Aplikacija je optimizovana za **produkciju** sa code splitting-om i SEO optimizacijom.

---

**Datum kreiranja dokumentacije:** 2024  
**Verzija projekta:** 0.0.0
