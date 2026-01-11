# Koraci za rešavanje problema: Forma se submit-uje pri kliku na "Postavi kao glavnu"

## Problem
Kada korisnik klikne na dugme "Postavi kao glavnu" u PhotoUpload komponenti, forma se automatski submit-uje i zatvara.

## Analiza problema

### Uzrok:
1. **Event Bubbling**: Klik event se propagira kroz DOM hijerarhiju do form elementa
2. **HTML Form ponašanje**: Browser automatski submit-uje formu kada se klikne na dugme unutar forme (čak i sa `type="button"` ako event nije pravilno zaustavljen)
3. **Nedovoljna zaštita**: Iako postoji `preventDefault()` i `stopPropagation()`, event se i dalje može propagirati kroz više nivoa DOM-a

## Rešenje - Implementirane izmene

### 1. Dodat wrapper div oko PhotoUpload u PonudaForm
- Dodat `onClick` handler koji zaustavlja propagaciju
- Dodat `onKeyDown` handler koji spreči submit na Enter key

### 2. Poboljšan onClick handler na form elementu
- Proverava da li je klik na button, file input, ili PhotoUpload area
- Zaustavlja propagaciju za sve relevantne elemente

### 3. Dodat onClick handler na glavni wrapper div u PhotoUpload
- Dodat `data-photo-upload` atribut za lakše prepoznavanje
- Dodat `onClick` i `onKeyDown` handleri koji zaustavljaju propagaciju

## Testiranje

### Koraci za testiranje:
1. Otvori formu za dodavanje nove ponude
2. Upload-uj nekoliko fotografija
3. Klikni na dugme "Postavi kao glavnu" na bilo kojoj fotografiji
4. **Očekivano ponašanje**: Forma se NE sme submit-ovati, samo se fotografija postavlja kao glavna
5. Klikni na dugme "Sačuvaj ponudu" na dnu forme
6. **Očekivano ponašanje**: Forma se submit-uje i čuva ponudu

## Ako problem i dalje postoji

### Dodatni koraci za debug:
1. Otvori Developer Tools (F12)
2. Idite na Console tab
3. Dodaj breakpoint u `handleSubmit` funkciju u `PonudaForm.jsx`
4. Klikni na "Postavi kao glavnu"
5. Proveri da li se `handleSubmit` poziva (ne bi trebalo)

### Alternativno rešenje (ako problem i dalje postoji):
Možemo da izvučemo PhotoUpload komponentu van form elementa i koristimo portal ili drugačiji pristup.
