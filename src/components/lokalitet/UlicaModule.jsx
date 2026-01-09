import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../utils/supabase'
import { Edit, Trash2, Plus, Navigation, ArrowUp, ArrowDown, Search, X } from 'lucide-react'

export default function UlicaModule() {
  const [ulice, setUlice] = useState([])
  const [lokacije, setLokacije] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUlica, setEditingUlica] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterValue, setFilterValue] = useState('')
  const [formData, setFormData] = useState({
    opis: '',
    idlokacija: ''
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
      idlokacija: ulica.idlokacija || ''
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingUlica(null)
    setFormData({
      opis: '',
      idlokacija: lokacije.length > 0 ? lokacije[0].id : ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.opis.trim()) {
      alert('Opis je obavezan')
      return
    }

    if (!formData.idlokacija) {
      alert('Lokacija je obavezna')
      return
    }

    try {
      if (editingUlica) {
        const { error } = await supabase
          .from('ulica')
          .update({
            opis: formData.opis.trim(),
            idlokacija: parseInt(formData.idlokacija)
          })
          .eq('id', editingUlica.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ulica')
          .insert([{
            opis: formData.opis.trim(),
            idlokacija: parseInt(formData.idlokacija)
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
    let data = [...ulice]

    // Filtriranje
    if (filterValue && sortColumn) {
      const filterLower = filterValue.toLowerCase()
      data = data.filter((item) => {
        let value = item[sortColumn]
        // Za foreign key kolone, koristi opis iz referentne tabele
        if (sortColumn === 'idlokacija') {
          const lokacija = lokacije.find(l => l.id === item.idlokacija)
          value = lokacija?.opis || ''
        }
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(filterLower)
      })
    }

    // Sortiranje
    if (sortColumn) {
      data.sort((a, b) => {
        let aVal = a[sortColumn]
        let bVal = b[sortColumn]

        // Za foreign key kolone, koristi opis iz referentne tabele
        if (sortColumn === 'idlokacija') {
          const lokacijaA = lokacije.find(l => l.id === a.idlokacija)
          const lokacijaB = lokacije.find(l => l.id === b.idlokacija)
          aVal = lokacijaA?.opis || ''
          bVal = lokacijaB?.opis || ''
        }

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
  }, [ulice, lokacije, sortColumn, sortDirection, filterValue])

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
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Ulice</h3>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={lokacije.length === 0}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Dodaj ulicu</span>
          <span className="sm:hidden">Dodaj</span>
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
          {/* Filter input - prikazuje se samo kada je sortColumn postavljen */}
          {sortColumn && (
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={`Pretraži po ${sortColumn === 'id' ? 'ID' : sortColumn === 'opis' ? 'Opisu' : 'Lokaciji'}...`}
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
                    onClick={() => handleSort('opis')}
                  >
                    <div className="flex items-center">
                      Opis
                      {getSortIcon('opis')}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('idlokacija')}
                  >
                    <div className="flex items-center">
                      Lokacija
                      {getSortIcon('idlokacija')}
                    </div>
                  </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcije
                </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedData.map((ulica) => {
                  const lokacijaOpis = lokacije.find(l => l.id === ulica.idlokacija)?.opis || 'N/A'
                  return (
                    <tr key={ulica.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {ulica.id}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        {ulica.opis}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                        {lokacijaOpis} (ID: {ulica.idlokacija})
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => handleEdit(ulica)}
                            className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Izmeni</span>
                          </button>
                          <button
                            onClick={() => handleDelete(ulica.id)}
                            className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Obriši</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredAndSortedData.map((ulica) => {
              const lokacijaOpis = lokacije.find(l => l.id === ulica.idlokacija)?.opis || 'N/A'
              return (
                <div key={ulica.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">ID: {ulica.id}</div>
                      <div className="text-sm font-medium text-gray-900 mb-1">{ulica.opis}</div>
                      <div className="text-xs text-gray-500">Lokacija: {lokacijaOpis}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(ulica)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Izmeni
                    </button>
                    <button
                      onClick={() => handleDelete(ulica.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Obriši
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-auto">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {editingUlica ? 'Izmeni ulicu' : 'Dodaj novu ulicu'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokacija *
                </label>
                <select
                  value={formData.idlokacija}
                  onChange={(e) => setFormData({ ...formData, idlokacija: e.target.value })}
                  required
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
