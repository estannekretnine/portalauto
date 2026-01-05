// Script za seedovanje baze sa 2 korisnika
// Pokrenite ovaj script jednom da kreirate početne korisnike

import { supabase } from './supabase'

export const seedDatabase = async () => {
  try {
    // Proveri da li već postoje korisnici
    const { data: existingUsers } = await supabase
      .from('korisnici')
      .select('*')

    if (existingUsers && existingUsers.length > 0) {
      console.log('Korisnici već postoje u bazi')
      return
    }

    // Kreiraj 2 korisnika
    const korisnici = [
      {
        naziv: 'Marko Petrović',
        email: 'marko@example.com',
        password: 'marko123'
      },
      {
        naziv: 'Ana Jovanović',
        email: 'ana@example.com',
        password: 'ana123'
      }
    ]

    const { data, error } = await supabase
      .from('korisnici')
      .insert(korisnici)
      .select()

    if (error) {
      console.error('Greška pri kreiranju korisnika:', error)
      return
    }

    console.log('Uspešno kreirani korisnici:', data)

    // Obriši sve postojeće automobile
    const { error: deleteError } = await supabase
      .from('auto')
      .delete()
      .neq('id', 0) // Obriši sve

    if (deleteError) {
      console.error('Greška pri brisanju automobila:', deleteError)
    } else {
      console.log('Svi automobili su obrisani')
    }
  } catch (error) {
    console.error('Greška:', error)
  }
}

// Pokreni seedovanje ako se script direktno pozove
if (import.meta.hot) {
  // U development modu
  seedDatabase()
}

