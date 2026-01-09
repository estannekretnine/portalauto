import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { Edit, Trash2, Plus, Navigation } from 'lucide-react'

export default function LokacijaModule() {
  const [lokacije, setLokacije] = useState([])
  const [opstine, setOpstine] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLokacija, setEditingLokacija] = useState(null)
  const [formData, setFormData] = useState({
    opis: '',
    idopstina: ''
  })

  useEffect(() => {
    loadLokacije()
    loadOpstine()
  }, [])

  const loadOpstine = async () => {
    try {
      const { data, error } = await supabase
        .from('opstina')
        .select('*')
        .order('opis', { ascending: true })

      if (error) throw error
      setOpstine(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju opština:', error)
    }
  }

  const loadLokacije = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('lokacija')
        .select('*')
        .order('opis', { ascending: true })

      if (error) throw error
      setLokacije(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju lokacija:', error)
      alert('Greška pri učitavanju lokacija: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovu lokaciju?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('lokacija')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadLokacije()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju lokacije: ' + error.message)
    }
  }

  const handleEdit = (lokacija) => {
    setEditingLokacija(lokacija)
    setFormData({
      opis: lokacija.opis || '',
      idopstina: lokacija.idopstina || ''
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingLokacija(null)
    setFormData({
      opis: '',
      idopstina: opstine.length > 0 ? opstine[0].id : ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.opis.trim()) {
      alert('Opis je obavezan')
      return
    }

    if (!formData.idopstina) {
      alert('Opština je obavezna')
      return
    }

    try {
      if (editingLokacija) {
        const { error } = await supabase
          .from('lokacija')
          .update({
            opis: formData.opis.trim(),
            idopstina: parseInt(formData.idopstina)
          })
          .eq('id', editingLokacija.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('lokacija')
          .insert([{
            opis: formData.opis.trim(),
            idopstina: parseInt(formData.idopstina)
          }])

        if (error) throw error
      }

      setShowForm(false)
      loadLokacije()
    } catch (error) {
      console.error('Greška pri čuvanju lokacije:', error)
      alert('Greška pri čuvanju lokacije: ' + error.message)
    }
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
        <h3 className="text-xl font-semibold text-gray-800">Lokacije</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          disabled={opstine.length === 0}
        >
          <Plus className="w-5 h-5" />
          Dodaj lokaciju
        </button>
      </div>

      {opstine.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Morate prvo dodati opštinu pre dodavanja lokacija.</p>
        </div>
      )}

      {lokacije.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nema lokacija</p>
          <p className="text-gray-500 mb-4">Dodajte prvu lokaciju</p>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            disabled={opstine.length === 0}
          >
            Dodaj lokaciju
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opština ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lokacije.map((lokacija) => {
                  const opstinaOpis = opstine.find(o => o.id === lokacija.idopstina)?.opis || 'N/A'
                  return (
                    <tr key={lokacija.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lokacija.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {lokacija.opis}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {opstinaOpis} (ID: {lokacija.idopstina})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(lokacija)}
                            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Izmeni
                          </button>
                          <button
                            onClick={() => handleDelete(lokacija.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Obriši
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {editingLokacija ? 'Izmeni lokaciju' : 'Dodaj novu lokaciju'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opština *
                </label>
                <select
                  value={formData.idopstina}
                  onChange={(e) => setFormData({ ...formData, idopstina: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Izaberi opštinu</option>
                  {opstine.map((opstina) => (
                    <option key={opstina.id} value={opstina.id}>
                      {opstina.opis}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opis *
                </label>
                <input
                  type="text"
                  value={formData.opis}
                  onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingLokacija ? 'Sačuvaj izmene' : 'Kreiraj lokaciju'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
