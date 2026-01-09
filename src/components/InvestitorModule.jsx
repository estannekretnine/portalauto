import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { Edit, Trash2, Plus, Building2, ArrowUp, ArrowDown, Search, X } from 'lucide-react'

export default function InvestitorModule() {
  const [investitori, setInvestitori] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingInvestitor, setEditingInvestitor] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterValue, setFilterValue] = useState('')
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

  const getColumnLabel = (column) => {
    const labels = {
      'id': 'ID',
      'naziv': 'Nazivu',
      'adresa': 'Adresi',
      'email': 'Emailu',
      'kontaktosoba': 'Kontakt osobi',
      'kontakttel': 'Kontakt telefonu'
    }
    return labels[column] || column
  }

  const filteredAndSortedData = useMemo(() => {
    let data = [...investitori]

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
  }, [investitori, sortColumn, sortDirection, filterValue])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Učitavanje...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Investitori</h3>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Dodaj investitora</span>
          <span className="sm:hidden">Dodaj</span>
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
          {/* Filter input - prikazuje se samo kada je sortColumn postavljen */}
          {sortColumn && (
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={`Pretraži po ${getColumnLabel(sortColumn)}...`}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {filterValue && (
                  <button
                    onClick={() => setFilterValue('')}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    type="button"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      ID
                      {getSortIcon('id')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('naziv')}
                  >
                    <div className="flex items-center">
                      Naziv
                      {getSortIcon('naziv')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('adresa')}
                  >
                    <div className="flex items-center">
                      Adresa
                      {getSortIcon('adresa')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {getSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('kontaktosoba')}
                  >
                    <div className="flex items-center">
                      Kontakt osoba
                      {getSortIcon('kontaktosoba')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('kontakttel')}
                  >
                    <div className="flex items-center">
                      Kontakt tel
                      {getSortIcon('kontakttel')}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedData.map((investitor) => (
                  <tr key={investitor.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {investitor.id}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                      {investitor.naziv}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                      {investitor.adresa || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                      {investitor.email || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                      {investitor.kontaktosoba || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                      {investitor.kontakttel || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEdit(investitor)}
                          className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Izmeni</span>
                        </button>
                        <button
                          onClick={() => handleDelete(investitor.id)}
                          className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Obriši</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredAndSortedData.map((investitor) => (
              <div key={investitor.id} className="p-4 hover:bg-gray-50">
                <div className="space-y-2 mb-3">
                  <div className="text-xs text-gray-500">ID: {investitor.id}</div>
                  <div className="text-sm font-medium text-gray-900">{investitor.naziv}</div>
                  {investitor.adresa && (
                    <div className="text-xs text-gray-600">📍 {investitor.adresa}</div>
                  )}
                  {investitor.email && (
                    <div className="text-xs text-gray-600">✉️ {investitor.email}</div>
                  )}
                  {investitor.kontaktosoba && (
                    <div className="text-xs text-gray-600">👤 {investitor.kontaktosoba}</div>
                  )}
                  {investitor.kontakttel && (
                    <div className="text-xs text-gray-600">📞 {investitor.kontakttel}</div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(investitor)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Izmeni
                  </button>
                  <button
                    onClick={() => handleDelete(investitor.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {editingInvestitor ? 'Izmeni investitora' : 'Dodaj novog investitora'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naziv *
                </label>
                <input
                  type="text"
                  value={formData.naziv}
                  onChange={(e) => setFormData({ ...formData, naziv: e.target.value })}
                  required
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
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
