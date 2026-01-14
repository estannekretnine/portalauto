import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { Edit, Trash2, Plus, Building2, ArrowUp, ArrowDown, Search, X } from 'lucide-react'

export default function VrstaObjektaModule() {
  const [vrsteObjekata, setVrsteObjekata] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVrsta, setEditingVrsta] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterValue, setFilterValue] = useState('')
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
    let data = [...vrsteObjekata]

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
  }, [vrsteObjekata, sortColumn, sortDirection, filterValue])

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Vrsta objekta</h2>
          <p className="text-gray-500 mt-1">Upravljanje vrstama objekata</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Dodaj vrstu objekta</span>
        </button>
      </div>

      {vrsteObjekata.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema vrsta objekata</p>
          <p className="text-gray-500 mb-6">Dodajte prvu vrstu objekta</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            Dodaj vrstu objekta
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Filter input - prikazuje se samo kada je sortColumn postavljen */}
          {sortColumn && (
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={`Pretraži po ${sortColumn === 'id' ? 'ID' : sortColumn === 'opis' ? 'Opisu' : 'Datumu'}...`}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                {filterValue && (
                  <button
                    onClick={() => setFilterValue('')}
                    className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    type="button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-900 to-black">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    ID
                    {getSortIcon('id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors"
                  onClick={() => handleSort('opis')}
                >
                  <div className="flex items-center">
                    Opis
                    {getSortIcon('opis')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Kreirano
                    {getSortIcon('created_at')}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedData.map((vrsta) => (
                <tr key={vrsta.id} className="hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">
                      {vrsta.id}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {vrsta.opis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(vrsta.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(vrsta)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden lg:inline">Izmeni</span>
                      </button>
                      <button
                        onClick={() => handleDelete(vrsta.id)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden lg:inline">Obriši</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredAndSortedData.map((vrsta) => (
              <div key={vrsta.id} className="p-4 hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg mb-2">
                      ID: {vrsta.id}
                    </span>
                    <div className="text-sm font-medium text-gray-900 mb-2">{vrsta.opis}</div>
                    <div className="text-xs text-gray-500">{formatDate(vrsta.created_at)}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(vrsta)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Izmeni
                  </button>
                  <button
                    onClick={() => handleDelete(vrsta.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Obriši
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md my-auto">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {editingVrsta ? 'Izmeni vrstu objekta' : 'Dodaj novu vrstu objekta'}
                </h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opis *
                </label>
                <textarea
                  value={formData.opis}
                  onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none transition-all"
                  placeholder="Unesite opis vrste objekta..."
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
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
