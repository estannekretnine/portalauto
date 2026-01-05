// Komponenta za seedovanje baze
import { useState } from 'react'
import { supabase, supabaseAdmin } from '../utils/supabase'

export default function SeedButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSeed = async () => {
    setLoading(true)
    setMessage('')

    try {
      // Koristi admin client ako je dostupan, inače obični client
      const client = supabaseAdmin || supabase

      if (!supabaseAdmin) {
        setMessage('⚠️ Service Role Key nije podešen. Koristim anon key (može ne raditi zbog RLS).')
      }

      // Kreiraj 2 korisnika (ili update ako već postoje)
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

      // Prvo proveri da li korisnici već postoje
      const { data: existingUsers } = await client
        .from('korisnici')
        .select('email')
        .in('email', ['marko@example.com', 'ana@example.com'])

      const existingEmails = existingUsers?.map(u => u.email) || []
      
      // Filtriraj korisnike koji ne postoje
      const newUsers = korisnici.filter(k => !existingEmails.includes(k.email))
      
      if (newUsers.length > 0) {
        const { data, error } = await client
          .from('korisnici')
          .insert(newUsers)
          .select()

        if (error) {
          if (error.code === '42501') {
            throw new Error('RLS greška: Dodaj VITE_SUPABASE_SERVICE_ROLE_KEY u environment varijable ili pokreni seed.sql u Supabase SQL Editor-u')
          }
          throw error
        }

        setMessage(`✅ Uspešno kreirani korisnici: ${data.length}. ${existingEmails.length > 0 ? `(${existingEmails.length} već postoje)` : ''}`)
      } else {
        setMessage(`ℹ️ Svi korisnici već postoje u bazi.`)
      }

      // Obriši sve postojeće automobile
      const { error: deleteError } = await client
        .from('auto')
        .delete()
        .neq('id', 0) // Obriši sve

      if (deleteError) {
        console.error('Greška pri brisanju automobila:', deleteError)
        setMessage(prev => prev + ' ⚠️ Greška pri brisanju automobila.')
      } else {
        setMessage(prev => prev + ' ✅ Svi automobili su obrisani.')
      }
    } catch (error) {
      setMessage('❌ Greška: ' + error.message)
      console.error('Greška:', error)
    } finally {
      setLoading(false)
    }
  }

  // Prikaži uvek (i u production modu) jer je potrebno za seedovanje
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-semibold text-yellow-800 mb-2">Seed Baze</h3>
      <button
        onClick={handleSeed}
        disabled={loading}
        className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Seedovanje...' : 'Seeduj bazu (2 korisnika)'}
      </button>
      {message && (
        <p className="mt-2 text-sm text-yellow-800">{message}</p>
      )}
    </div>
  )
}

