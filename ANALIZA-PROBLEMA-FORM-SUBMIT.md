# Analiza problema: Forma se submit-uje pri kliku na "Postavi kao glavnu"

## Problem
Kada korisnik klikne na dugme "Postavi kao glavnu" u PhotoUpload komponenti, forma se automatski submit-uje i zatvara, umesto da samo postavi fotografiju kao glavnu.

## Uzrok problema

### 1. HTML Form ponašanje
- U HTML-u, sva `<button>` elementa unutar `<form>` imaju default `type="submit"` ako nije eksplicitno navedeno
- Čak i sa `type="button"`, event bubbling može da izazove probleme

### 2. Event Bubbling
- Kada se klikne na dugme, event se propagira kroz DOM hijerarhiju
- Ako forma ima `onSubmit` handler, event može da se propagira do forme

### 3. Trenutno stanje koda
- `PhotoUpload` komponenta je unutar `<form>` elementa u `PonudaForm`
- Dugmad imaju `type="button"` i `preventDefault/stopPropagation`
- Ali možda postoji još neki problem sa event propagacijom

## Rešenje - Koraci

### Korak 1: Dodaj wrapper div oko PhotoUpload sa onClick handler-om
```jsx
<div onClick={(e) => e.stopPropagation()}>
  <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
</div>
```

### Korak 2: Poboljšaj onClick handler na form elementu
Trenutno onClick handler na formi proverava samo file input i label. Treba da proveri i dugmad.

### Korak 3: Dodaj onKeyDown handler na formu
Spreči submit na Enter key ako je fokus na PhotoUpload komponenti.

### Korak 4: Dodaj onClick handler na wrapper div u PhotoUpload
Dodaj `onClick={(e) => e.stopPropagation()}` na glavni wrapper div u PhotoUpload komponenti.

## Implementacija

Treba da se izmeni:
1. `src/components/PonudaForm.jsx` - dodati wrapper div oko PhotoUpload
2. `src/components/PhotoUpload.jsx` - dodati onClick handler na glavni wrapper div
