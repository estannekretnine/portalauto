import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import PhotoUpload from './PhotoUpload'
import { Save, X } from 'lucide-react'

export default function AutoForm({ auto, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    proizvodjac: '',
    marka: '',
    presao: '',
    godiste: ''
  })
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (auto) {
      setFormData({
        proizvodjac: auto.proizvodjac || '',
        marka: auto.marka || '',
        presao: auto.presao || '',
        godiste: auto.godiste || ''
      })
      
      // Učitaj postojeće fotografije
      if (auto.foto && Array.isArray(auto.foto)) {
        setPhotos(auto.foto.map((foto, index) => ({
          id: foto.id || index,
          url: foto.url,
          opis: foto.opis || '',
          file: null // Postojeće fotografije nemaju file objekat
        })))
      }
    }
  }, [auto])

  // Cleanup blob URLs when form closes
  const handleCloseWithCleanup = () => {
    photos.forEach(photo => {
      if (photo.url && photo.url.startsWith('blob:')) {
        URL.revokeObjectURL(photo.url)
      }
    })
    onClose()
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Konvertuj nove fotografije u base64
      const fotoArray = await Promise.all(
        photos.map(async (photo) => {
          if (photo.file) {
            // Nova fotografija - konvertuj u base64
            const base64 = await convertFileToBase64(photo.file)
            return {
              id: photo.id,
              url: base64,
              opis: photo.opis || ''
            }
          } else {
            // Postojeća fotografija - zadrži postojeći URL
            return {
              id: photo.id,
              url: photo.url,
              opis: photo.opis || ''
            }
          }
        })
      )

      const autoData = {
        proizvodjac: formData.proizvodjac,
        marka: formData.marka,
        presao: formData.presao ? parseFloat(formData.presao) : null,
        godiste: formData.godiste ? parseFloat(formData.godiste) : null,
        foto: fotoArray.length > 0 ? fotoArray : null
      }

      if (auto) {
        // Update
        const { error: updateError } = await supabase
          .from('auto')
          .update(autoData)
          .eq('id', auto.id)

        if (updateError) throw updateError
      } else {
        // Create - treba nam user ID
        const userStr = localStorage.getItem('user')
        const user = userStr ? JSON.parse(userStr) : null
        
        if (!user) {
          throw new Error('Korisnik nije prijavljen')
        }

        const { error: insertError } = await supabase
          .from('auto')
          .insert([{ ...autoData, id: user.id }])

        if (insertError) throw insertError
      }

      onSuccess()
      handleCloseWithCleanup()
    } catch (err) {
      setError(err.message || 'Greška pri čuvanju automobila')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {auto ? 'Izmeni automobil' : 'Dodaj novi automobil'}
          </h2>
          <button
            onClick={handleCloseWithCleanup}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proizvođač *
              </label>
              <input
                type="text"
                value={formData.proizvodjac}
                onChange={(e) => setFormData({ ...formData, proizvodjac: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marka
              </label>
              <input
                type="text"
                value={formData.marka}
                onChange={(e) => setFormData({ ...formData, marka: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prešao (km)
              </label>
              <input
                type="number"
                value={formData.presao}
                onChange={(e) => setFormData({ ...formData, presao: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Godište
              </label>
              <input
                type="number"
                value={formData.godiste}
                onChange={(e) => setFormData({ ...formData, godiste: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fotografije
            </label>
            <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseWithCleanup}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

