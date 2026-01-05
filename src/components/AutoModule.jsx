import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { getCurrentUser } from '../utils/auth'
import AutoForm from './AutoForm'
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'

export default function AutoModule() {
  const [autos, setAutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAuto, setEditingAuto] = useState(null)

  useEffect(() => {
    loadAutos()
  }, [])

  const loadAutos = async () => {
    try {
      setLoading(true)
      const currentUser = getCurrentUser()
      if (!currentUser) return

      const { data, error } = await supabase
        .from('auto')
        .select('*')
        .eq('id', currentUser.id)

      if (error) throw error

      setAutos(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju automobila:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovaj automobil?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('auto')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadAutos()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju automobila')
    }
  }

  const handleEdit = (auto) => {
    setEditingAuto(auto)
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingAuto(null)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingAuto(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Učitavanje...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Automobili</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Dodaj automobil
        </button>
      </div>

      {autos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nema automobila</p>
          <p className="text-gray-500 mb-4">Dodajte svoj prvi automobil</p>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Dodaj automobil
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {autos.map((auto) => (
            <div key={auto.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {auto.foto && Array.isArray(auto.foto) && auto.foto.length > 0 && (
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={auto.foto[0].url}
                    alt={auto.foto[0].opis || 'Automobil'}
                    className="w-full h-full object-cover"
                  />
                  {auto.foto.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      +{auto.foto.length - 1}
                    </div>
                  )}
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {auto.proizvodjac} {auto.marka}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {auto.godiste && (
                    <p>Godište: {auto.godiste}</p>
                  )}
                  {auto.presao && (
                    <p>Prešao: {auto.presao.toLocaleString()} km</p>
                  )}
                  {auto.foto && Array.isArray(auto.foto) && (
                    <p>Fotografija: {auto.foto.length}</p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(auto)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Izmeni
                  </button>
                  <button
                    onClick={() => handleDelete(auto.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AutoForm
          auto={editingAuto}
          onClose={handleCloseForm}
          onSuccess={loadAutos}
        />
      )}
    </div>
  )
}

