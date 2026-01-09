import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Edit, Trash2, Plus, Building2 } from 'lucide-react'

export default function InvestitorModule() {
  const [investitori, setInvestitori] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingInvestitor, setEditingInvestitor] = useState(null)
  const [formData, setFormData] = useState({
    naziv: '',
    adresa: '',
    email: '',
    kontaktosoba: '',
    kontakttel: ''
  })

  useEffect(() => {
    loadInvestitori()
  }, [])

  const loadInvestitori = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('investitor')
        .select('*')
        .order('naziv', { ascending: true })

      if (error) throw error

      setInvestitori(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju investitora:', error)
      alert('Greška pri učitavanju investitora: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovog investitora?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('investitor')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadInvestitori()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju investitora: ' + error.message)
    }
  }

  const handleEdit = (investitor) => {
    setEditingInvestitor(investitor)
    setFormData({
      naziv: investitor.naziv || '',
      adresa: investitor.adresa || '',
      email: investitor.email || '',
      kontaktosoba: investitor.kontaktosoba || '',
      kontakttel: investitor.kontakttel || ''
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingInvestitor(null)
    setFormData({
      naziv: '',
      adresa: '',
      email: '',
      kontaktosoba: '',
      kontakttel: ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.naziv.trim()) {
      alert('Naziv je obavezan')
      return
    }

    try {
      const updateData = {
        naziv: formData.naziv.trim(),
        adresa: formData.adresa.trim() || null,
        email: formData.email.trim() || null,
        kontaktosoba: formData.kontaktosoba.trim() || null,
        kontakttel: formData.kontakttel.trim() || null
      }

      if (editingInvestitor) {
        const { error } = await supabase
          .from('investitor')
          .update(updateData)
          .eq('id', editingInvestitor.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('investitor')
          .insert([updateData])

        if (error) throw error
      }

      setShowForm(false)
      loadInvestitori()
    } catch (error) {
      console.error('Greška pri čuvanju investitora:', error)
      alert('Greška pri čuvanju investitora: ' + error.message)
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
        <h3 className="text-xl font-semibold text-gray-800">Investitori</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Dodaj investitora
        </button>
      </div>

      {investitori.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nema investitora</p>
          <p className="text-gray-500 mb-4">Dodajte prvog investitora</p>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Dodaj investitora
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
                    Naziv
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt osoba
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt tel
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {investitori.map((investitor) => (
                  <tr key={investitor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {investitor.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {investitor.naziv}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {investitor.adresa || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {investitor.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {investitor.kontaktosoba || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {investitor.kontakttel || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(investitor)}
                          className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Izmeni
                        </button>
                        <button
                          onClick={() => handleDelete(investitor.id)}
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
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {editingInvestitor ? 'Izmeni investitora' : 'Dodaj novog investitora'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naziv *
                </label>
                <input
                  type="text"
                  value={formData.naziv}
                  onChange={(e) => setFormData({ ...formData, naziv: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresa
                </label>
                <input
                  type="text"
                  value={formData.adresa}
                  onChange={(e) => setFormData({ ...formData, adresa: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kontakt osoba
                </label>
                <input
                  type="text"
                  value={formData.kontaktosoba}
                  onChange={(e) => setFormData({ ...formData, kontaktosoba: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kontakt telefon
                </label>
                <input
                  type="tel"
                  value={formData.kontakttel}
                  onChange={(e) => setFormData({ ...formData, kontakttel: e.target.value })}
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
                  {editingInvestitor ? 'Sačuvaj izmene' : 'Kreiraj investitora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
