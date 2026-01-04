# React Auto Dashboard

Web aplikacija za upravljanje automobilima sa login sistemom, Gmail-like navigacijom i responzivnim CRUD modulom.

## Tehnologije

- React (Vite)
- Tailwind CSS
- Lucide React (ikonice)

## Funkcionalnosti

- **Login sistem**: Zaštićen šifrom `admin123`
- **Responzivni layout**: Sidebar navigacija i glavni panel
- **CRUD operacije za automobile**:
  - Dodavanje novih automobila
  - Uređivanje postojećih automobila
  - Brisanje automobila
  - Prikaz u responzivnom grid-u
- **Galerija slika**: 5 slika po automobilu sa lightbox prikazom

## Pokretanje

```bash
# Instalacija zavisnosti
npm install

# Pokretanje development servera
npm run dev

# Build za produkciju
npm run build
```

## Struktura projekta

```
src/
├── components/
│   ├── Login.jsx          # Login komponenta
│   ├── Dashboard.jsx      # Glavni dashboard layout
│   ├── Sidebar.jsx        # Sidebar navigacija
│   ├── CarsModule.jsx     # CRUD modul za automobile
│   ├── CarsList.jsx       # Prikaz liste automobila
│   └── CarForm.jsx        # Forma za dodavanje/uređivanje
├── App.jsx                # Glavna aplikacija
├── main.jsx               # Entry point
└── index.css              # Globalni stilovi
```

## Atributi automobila

- ID (automatski generisan)
- Proizvođač
- Model
- Godište
- Prešao km
- 5 fotografija (niz URL-ova)

