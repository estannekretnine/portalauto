import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { Edit, Trash2, Plus, Flame, ArrowUp, ArrowDown, Search, X } from 'lucide-react'

export default function GrejanjeModule() {
  const [grejanja, setGrejanja] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGrejanje, setEditingGrejanje] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterValue, setFilterValue] = useState('')
  const [formData, setFormData] = useState({
    opis: ''
  })

  useEffect(() => {
    loadGrejanja()
  }, [])

  const loadGrejanja = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('grejanje')
        .select('*')
        .order('opis', { ascending: true })

      if (error) throw error

      setGrejanja(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju grejanja:', error)
      alert('Greška pri učitavanju grejanja: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovo grejanje?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('grejanje')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadGrejanja()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju grejanja: ' + error.message)
    }
  }

  const handleEdit = (grejanje) => {
    setEditingGrejanje(grejanje)
    setFormData({
      opis: grejanje.opis || ''
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingGrejanje(null)
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
      if (editingGrejanje) {
        const { error } = await supabase
          .from('grejanje')
          .update({ opis: formData.opis.trim() })
          .eq('id', editingGrejanje.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('grejanje')
          .insert([{ opis: formData.opis.trim() }])

        if (error) throw error
      }

      setShowForm(false)
      loadGrejanja()
    } catch (error) {
      console.error('Greška pri čuvanju grejanja:', error)
      alert('Greška pri čuvanju grejanja: ' + error.message)
    }
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setFilterValue('') // Resetuj filter pri promeni sortiranja
  }

  const getSortIcon = (column) => {
    if (sortColumn !== column) return null
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 inline-block ml-1" />
    )
  }

  const filteredAndSortedData = useMemo(() => {
    let data = [...grejanja]

    // Filtriranje
    if (filterValue && sortColumn) {
      const filterLower = filterValue.toLowerCase()
      data = data.filter((item) => {
        const value = item[sortColumn]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(filterLower)
      })
    }

    // Sortiranje
    if (sortColumn) {
      data.sort((a, b) => {
        let aVal = a[sortColumn]
        let bVal = b[sortColumn]

        // Handle null/undefined
        if (aVal === null || aVal === undefined) aVal = ''
        if (bVal === null || bVal === undefined) bVal = ''

        // Convert to string for comparison
        aVal = String(aVal).toLowerCase()
        bVal = String(bVal).toLowerCase()

        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
        }
      })
    }

    return data
  }, [grejanja, sortColumn, sortDirection, filterValue])

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
        <h3 className="text-xl font-semibold text-gray-800">Grejanje</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Dodaj grejanje
        </button>
      </div>

      {grejanja.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Flame className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nema grejanja</p>
          <p className="text-gray-500 mb-4">Dodajte prvo grejanje</p>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Dodaj grejanje
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Filter input - prikazuje se samo kada je sortColumn postavljen */}
          {sortColumn && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={`Pretraži po ${sortColumn === 'id' ? 'ID' : 'Opisu'}...`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {filterValue && (
                  <button
                    onClick={() => setFilterValue('')}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    ID
                    {getSortIcon('id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('opis')}
                >
                  <div className="flex items-center">
                    Opis
                    {getSortIcon('opis')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedData.map((grejanje) => (
                <tr key={grejanje.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {grejanje.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {grejanje.opis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(grejanje)}
                        className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Izmeni
                      </button>
                      <button
                        onClick={() => handleDelete(grejanje.id)}
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
                {editingGrejanje ? 'Izmeni grejanje' : 'Dodaj novo grejanje'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  {editingGrejanje ? 'Sačuvaj izmene' : 'Kreiraj grejanje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
