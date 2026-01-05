// Komponenta za seedovanje baze - samo za development
import { useState } from 'react'
import { supabase } from '../utils/supabase'

export default function SeedButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSeed = async () => {
    setLoading(true)
    setMessage('')

    try {
      // Proveri da li već postoje korisnici
      const { data: existingUsers } = await supabase
        .from('korisnici')
        .select('*')

      if (existingUsers && existingUsers.length > 0) {
        setMessage('Korisnici već postoje u bazi. Preskačem kreiranje.')
        setLoading(false)
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
        throw error
      }

      setMessage(`Uspešno kreirani korisnici: ${data.length}`)

      // Obriši sve postojeće automobile
      const { error: deleteError } = await supabase
        .from('auto')
        .delete()
        .neq('id', 0) // Obriši sve

      if (deleteError) {
        console.error('Greška pri brisanju automobila:', deleteError)
        setMessage(message + ' Greška pri brisanju automobila.')
      } else {
        setMessage(message + ' Svi automobili su obrisani.')
      }
    } catch (error) {
      setMessage('Greška: ' + error.message)
      console.error('Greška:', error)
    } finally {
      setLoading(false)
    }
  }

  // Prikaži samo u development modu
  if (import.meta.env.PROD) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-semibold text-yellow-800 mb-2">Development Tools</h3>
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

