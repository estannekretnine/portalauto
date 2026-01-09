import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { Edit, Trash2, Plus, Navigation } from 'lucide-react'

export default function UlicaModule() {
  const [ulice, setUlice] = useState([])
  const [lokacije, setLokacije] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUlica, setEditingUlica] = useState(null)
  const [formData, setFormData] = useState({
    opis: '',
    lokacija_id: ''
  })

  useEffect(() => {
    loadUlice()
    loadLokacije()
  }, [])

  const loadLokacije = async () => {
    try {
      const { data, error } = await supabase
        .from('lokacija')
        .select('*')
        .order('opis', { ascending: true })

      if (error) throw error
      setLokacije(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju lokacija:', error)
    }
  }

  const loadUlice = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ulica')
        .select('*')
        .order('opis', { ascending: true })

      if (error) throw error
      setUlice(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju ulica:', error)
      alert('Greška pri učitavanju ulica: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovu ulicu?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('ulica')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadUlice()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju ulice: ' + error.message)
    }
  }

  const handleEdit = (ulica) => {
    setEditingUlica(ulica)
    setFormData({
      opis: ulica.opis || '',
      lokacija_id: ulica.lokacija_id || ''
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingUlica(null)
    setFormData({
      opis: '',
      lokacija_id: lokacije.length > 0 ? lokacije[0].id : ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.opis.trim()) {
      alert('Opis je obavezan')
      return
    }

    if (!formData.lokacija_id) {
      alert('Lokacija je obavezna')
      return
    }

    try {
      if (editingUlica) {
        const { error } = await supabase
          .from('ulica')
          .update({
            opis: formData.opis.trim(),
            lokacija_id: parseInt(formData.lokacija_id)
          })
          .eq('id', editingUlica.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ulica')
          .insert([{
            opis: formData.opis.trim(),
            lokacija_id: parseInt(formData.lokacija_id)
          }])

        if (error) throw error
      }

      setShowForm(false)
      loadUlice()
    } catch (error) {
      console.error('Greška pri čuvanju ulice:', error)
      alert('Greška pri čuvanju ulice: ' + error.message)
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
        <h3 className="text-xl font-semibold text-gray-800">Ulice</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          disabled={lokacije.length === 0}
        >
          <Plus className="w-5 h-5" />
          Dodaj ulicu
        </button>
      </div>

      {lokacije.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Morate prvo dodati lokaciju pre dodavanja ulica.</p>
        </div>
      )}

      {ulice.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nema ulica</p>
          <p className="text-gray-500 mb-4">Dodajte prvu ulicu</p>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            disabled={lokacije.length === 0}
          >
            Dodaj ulicu
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
                    Lokacija ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ulice.map((ulica) => {
                  const lokacijaOpis = lokacije.find(l => l.id === ulica.lokacija_id)?.opis || 'N/A'
                  return (
                    <tr key={ulica.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ulica.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {ulica.opis}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {lokacijaOpis} (ID: {ulica.lokacija_id})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(ulica)}
                            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Izmeni
                          </button>
                          <button
                            onClick={() => handleDelete(ulica.id)}
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
                {editingUlica ? 'Izmeni ulicu' : 'Dodaj novu ulicu'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokacija *
                </label>
                <select
                  value={formData.lokacija_id}
                  onChange={(e) => setFormData({ ...formData, lokacija_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Izaberi lokaciju</option>
                  {lokacije.map((lokacija) => (
                    <option key={lokacija.id} value={lokacija.id}>
                      {lokacija.opis}
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
                  {editingUlica ? 'Sačuvaj izmene' : 'Kreiraj ulicu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
