import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../utils/supabase'
import { Edit, Trash2, Plus, Navigation, ArrowUp, ArrowDown, Search, X } from 'lucide-react'

export default function LokacijaModule() {
  const [lokacije, setLokacije] = useState([])
  const [opstine, setOpstine] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLokacija, setEditingLokacija] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterValue, setFilterValue] = useState('')
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
    let data = [...lokacije]

    // Filtriranje
    if (filterValue && sortColumn) {
      const filterLower = filterValue.toLowerCase()
      data = data.filter((item) => {
        let value = item[sortColumn]
        // Za foreign key kolone, koristi opis iz referentne tabele
        if (sortColumn === 'idopstina') {
          const opstina = opstine.find(o => o.id === item.idopstina)
          value = opstina?.opis || ''
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
        if (sortColumn === 'idopstina') {
          const opstinaA = opstine.find(o => o.id === a.idopstina)
          const opstinaB = opstine.find(o => o.id === b.idopstina)
          aVal = opstinaA?.opis || ''
          bVal = opstinaB?.opis || ''
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
  }, [lokacije, opstine, sortColumn, sortDirection, filterValue])

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
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Lokacije</h3>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={opstine.length === 0}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Dodaj lokaciju</span>
          <span className="sm:hidden">Dodaj</span>
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
          {/* Filter input - prikazuje se samo kada je sortColumn postavljen */}
          {sortColumn && (
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={`Pretraži po ${sortColumn === 'id' ? 'ID' : sortColumn === 'opis' ? 'Opisu' : 'Opštini'}...`}
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
                    onClick={() => handleSort('idopstina')}
                  >
                    <div className="flex items-center">
                      Opština
                      {getSortIcon('idopstina')}
                    </div>
                  </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcije
                </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedData.map((lokacija) => {
                  const opstinaOpis = opstine.find(o => o.id === lokacija.idopstina)?.opis || 'N/A'
                  return (
                    <tr key={lokacija.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {lokacija.id}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        {lokacija.opis}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                        {opstinaOpis} (ID: {lokacija.idopstina})
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => handleEdit(lokacija)}
                            className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Izmeni</span>
                          </button>
                          <button
                            onClick={() => handleDelete(lokacija.id)}
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
            {filteredAndSortedData.map((lokacija) => {
              const opstinaOpis = opstine.find(o => o.id === lokacija.idopstina)?.opis || 'N/A'
              return (
                <div key={lokacija.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">ID: {lokacija.id}</div>
                      <div className="text-sm font-medium text-gray-900 mb-1">{lokacija.opis}</div>
                      <div className="text-xs text-gray-500">Opština: {opstinaOpis}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(lokacija)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Izmeni
                    </button>
                    <button
                      onClick={() => handleDelete(lokacija.id)}
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
                {editingLokacija ? 'Izmeni lokaciju' : 'Dodaj novu lokaciju'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opština *
                </label>
                <select
                  value={formData.idopstina}
                  onChange={(e) => setFormData({ ...formData, idopstina: e.target.value })}
                  required
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
