import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { Edit, Trash2, Plus, Building2, ArrowUp, ArrowDown, Search, X, Mail, Phone, User, MapPin } from 'lucide-react'

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Investitori</h2>
          <p className="text-gray-500 mt-1">Upravljanje investitorima</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Dodaj investitora</span>
        </button>
      </div>

      {investitori.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema investitora</p>
          <p className="text-gray-500 mb-6">Dodajte prvog investitora</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            Dodaj investitora
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
                  placeholder={`Pretraži po ${getColumnLabel(sortColumn)}...`}
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
                    onClick={() => handleSort('naziv')}
                  >
                    <div className="flex items-center">
                      Naziv
                      {getSortIcon('naziv')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors"
                    onClick={() => handleSort('adresa')}
                  >
                    <div className="flex items-center">
                      Adresa
                      {getSortIcon('adresa')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {getSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors"
                    onClick={() => handleSort('kontaktosoba')}
                  >
                    <div className="flex items-center">
                      Kontakt osoba
                      {getSortIcon('kontaktosoba')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors"
                    onClick={() => handleSort('kontakttel')}
                  >
                    <div className="flex items-center">
                      Kontakt tel
                      {getSortIcon('kontakttel')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedData.map((investitor) => (
                  <tr key={investitor.id} className="hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">
                        {investitor.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(investitor)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden lg:inline">Izmeni</span>
                        </button>
                        <button
                          onClick={() => handleDelete(investitor.id)}
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
            {filteredAndSortedData.map((investitor) => (
              <div key={investitor.id} className="p-4 hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                <div className="space-y-2 mb-3">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">
                    ID: {investitor.id}
                  </span>
                  <div className="text-sm font-medium text-gray-900">{investitor.naziv}</div>
                  {investitor.adresa && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5" />
                      {investitor.adresa}
                    </div>
                  )}
                  {investitor.email && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Mail className="w-3.5 h-3.5" />
                      {investitor.email}
                    </div>
                  )}
                  {investitor.kontaktosoba && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <User className="w-3.5 h-3.5" />
                      {investitor.kontaktosoba}
                    </div>
                  )}
                  {investitor.kontakttel && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Phone className="w-3.5 h-3.5" />
                      {investitor.kontakttel}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(investitor)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Izmeni
                  </button>
                  <button
                    onClick={() => handleDelete(investitor.id)}
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
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {editingInvestitor ? 'Izmeni investitora' : 'Dodaj novog investitora'}
                </h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Naziv *
                </label>
                <input
                  type="text"
                  value={formData.naziv}
                  onChange={(e) => setFormData({ ...formData, naziv: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Unesite naziv investitora..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresa
                </label>
                <input
                  type="text"
                  value={formData.adresa}
                  onChange={(e) => setFormData({ ...formData, adresa: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Unesite adresu..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Unesite email..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kontakt osoba
                </label>
                <input
                  type="text"
                  value={formData.kontaktosoba}
                  onChange={(e) => setFormData({ ...formData, kontaktosoba: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Unesite ime kontakt osobe..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kontakt telefon
                </label>
                <input
                  type="tel"
                  value={formData.kontakttel}
                  onChange={(e) => setFormData({ ...formData, kontakttel: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Unesite kontakt telefon..."
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
