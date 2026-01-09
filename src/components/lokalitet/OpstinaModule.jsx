import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { Edit, Trash2, Plus, Map } from 'lucide-react'

export default function OpstinaModule() {
  const [opstine, setOpstine] = useState([])
  const [gradovi, setGradovi] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOpstina, setEditingOpstina] = useState(null)
  const [formData, setFormData] = useState({
    opis: '',
    idgrad: ''
  })

  useEffect(() => {
    loadOpstine()
    loadGradovi()
  }, [])

  const loadGradovi = async () => {
    try {
      const { data, error } = await supabase
        .from('grad')
        .select('*')
        .order('opis', { ascending: true })

      if (error) throw error
      setGradovi(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju gradova:', error)
    }
  }

  const loadOpstine = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('opstina')
        .select('*')
        .order('opis', { ascending: true })

      if (error) throw error
      setOpstine(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju opština:', error)
      alert('Greška pri učitavanju opština: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovu opštinu?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('opstina')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadOpstine()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju opštine: ' + error.message)
    }
  }

  const handleEdit = (opstina) => {
    setEditingOpstina(opstina)
    setFormData({
      opis: opstina.opis || '',
      idgrad: opstina.idgrad || ''
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingOpstina(null)
    setFormData({
      opis: '',
      idgrad: gradovi.length > 0 ? gradovi[0].id : ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.opis.trim()) {
      alert('Opis je obavezan')
      return
    }

    if (!formData.idgrad) {
      alert('Grad je obavezan')
      return
    }

    try {
      if (editingOpstina) {
        const { error } = await supabase
          .from('opstina')
          .update({
            opis: formData.opis.trim(),
            idgrad: parseInt(formData.idgrad)
          })
          .eq('id', editingOpstina.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('opstina')
          .insert([{
            opis: formData.opis.trim(),
            idgrad: parseInt(formData.idgrad)
          }])

        if (error) throw error
      }

      setShowForm(false)
      loadOpstine()
    } catch (error) {
      console.error('Greška pri čuvanju opštine:', error)
      alert('Greška pri čuvanju opštine: ' + error.message)
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
        <h3 className="text-xl font-semibold text-gray-800">Opštine</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          disabled={gradovi.length === 0}
        >
          <Plus className="w-5 h-5" />
          Dodaj opštinu
        </button>
      </div>

      {gradovi.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Morate prvo dodati grad pre dodavanja opština.</p>
        </div>
      )}

      {opstine.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nema opština</p>
          <p className="text-gray-500 mb-4">Dodajte prvu opštinu</p>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            disabled={gradovi.length === 0}
          >
            Dodaj opštinu
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
                    Grad ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {opstine.map((opstina) => {
                  const gradOpis = gradovi.find(g => g.id === opstina.idgrad)?.opis || 'N/A'
                  return (
                    <tr key={opstina.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {opstina.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {opstina.opis}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {gradOpis} (ID: {opstina.idgrad})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(opstina)}
                            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Izmeni
                          </button>
                          <button
                            onClick={() => handleDelete(opstina.id)}
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
                {editingOpstina ? 'Izmeni opštinu' : 'Dodaj novu opštinu'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grad *
                </label>
                <select
                  value={formData.idgrad}
                  onChange={(e) => setFormData({ ...formData, idgrad: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Izaberi grad</option>
                  {gradovi.map((grad) => (
                    <option key={grad.id} value={grad.id}>
                      {grad.opis}
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
                  {editingOpstina ? 'Sačuvaj izmene' : 'Kreiraj opštinu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
