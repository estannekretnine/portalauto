import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Edit, Trash2, Plus, Building2 } from 'lucide-react'

export default function VrstaObjektaModule() {
  const [vrsteObjekata, setVrsteObjekata] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVrsta, setEditingVrsta] = useState(null)
  const [formData, setFormData] = useState({
    opis: ''
  })

  useEffect(() => {
    loadVrsteObjekata()
  }, [])

  const loadVrsteObjekata = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('vrstaobjekta')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setVrsteObjekata(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju vrsta objekata:', error)
      alert('Greška pri učitavanju vrsta objekata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovu vrstu objekta?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('vrstaobjekta')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadVrsteObjekata()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju vrste objekta: ' + error.message)
    }
  }

  const handleEdit = (vrsta) => {
    setEditingVrsta(vrsta)
    setFormData({
      opis: vrsta.opis || ''
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingVrsta(null)
    setFormData({
      opis: ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.opis.trim()) {
      alert('Opis je obavezan')
      return
    }

    try {
      if (editingVrsta) {
        // Update
        const { error } = await supabase
          .from('vrstaobjekta')
          .update({ opis: formData.opis.trim() })
          .eq('id', editingVrsta.id)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('vrstaobjekta')
          .insert([{ opis: formData.opis.trim() }])

        if (error) throw error
      }

      setShowForm(false)
      loadVrsteObjekata()
    } catch (error) {
      console.error('Greška pri čuvanju vrste objekta:', error)
      alert('Greška pri čuvanju vrste objekta: ' + error.message)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('sr-RS', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Belgrade'
      })
    } catch {
      return dateString
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
        <h2 className="text-2xl font-bold text-gray-800">Vrsta objekta</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Dodaj vrstu objekta
        </button>
      </div>

      {vrsteObjekata.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nema vrsta objekata</p>
          <p className="text-gray-500 mb-4">Dodajte prvu vrstu objekta</p>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Dodaj vrstu objekta
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  Kreirano
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vrsteObjekata.map((vrsta) => (
                <tr key={vrsta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vrsta.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {vrsta.opis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(vrsta.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(vrsta)}
                        className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Izmeni
                      </button>
                      <button
                        onClick={() => handleDelete(vrsta.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Obriši
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {editingVrsta ? 'Izmeni vrstu objekta' : 'Dodaj novu vrstu objekta'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opis *
                </label>
                <textarea
                  value={formData.opis}
                  onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Unesite opis vrste objekta..."
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
                  {editingVrsta ? 'Sačuvaj izmene' : 'Kreiraj vrstu objekta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
