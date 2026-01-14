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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Lokacije</h2>
          <p className="text-gray-500 mt-1">Upravljanje lokacijama</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={opstine.length === 0}
        >
          <Plus className="w-5 h-5" />
          <span>Dodaj lokaciju</span>
        </button>
      </div>

      {opstine.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-800 font-medium">Morate prvo dodati opštinu pre dodavanja lokacija.</p>
        </div>
      )}

      {lokacije.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Navigation className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema lokacija</p>
          <p className="text-gray-500 mb-6">Dodajte prvu lokaciju</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={opstine.length === 0}
          >
            Dodaj lokaciju
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
                  placeholder={`Pretraži po ${sortColumn === 'id' ? 'ID' : sortColumn === 'opis' ? 'Opisu' : 'Opštini'}...`}
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
                    onClick={() => handleSort('idopstina')}
                  >
                    <div className="flex items-center">
                      Opština
                      {getSortIcon('idopstina')}
                    </div>
                  </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                  Akcije
                </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedData.map((lokacija) => {
                  const opstinaOpis = opstine.find(o => o.id === lokacija.idopstina)?.opis || 'N/A'
                  return (
                    <tr key={lokacija.id} className="hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">
                          {lokacija.id}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {lokacija.opis}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {opstinaOpis}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(lokacija)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden lg:inline">Izmeni</span>
                          </button>
                          <button
                            onClick={() => handleDelete(lokacija.id)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden lg:inline">Obriši</span>
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
          <div className="md:hidden divide-y divide-gray-100">
            {filteredAndSortedData.map((lokacija) => {
              const opstinaOpis = opstine.find(o => o.id === lokacija.idopstina)?.opis || 'N/A'
              return (
                <div key={lokacija.id} className="p-4 hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg mb-2">
                        ID: {lokacija.id}
                      </span>
                      <div className="text-sm font-medium text-gray-900 mb-1">{lokacija.opis}</div>
                      <div className="text-xs text-gray-500">Opština: {opstinaOpis}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(lokacija)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Izmeni
                    </button>
                    <button
                      onClick={() => handleDelete(lokacija.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20 text-sm font-medium"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md my-auto">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {editingLokacija ? 'Izmeni lokaciju' : 'Dodaj novu lokaciju'}
                </h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opština *
                </label>
                <select
                  value={formData.idopstina}
                  onChange={(e) => setFormData({ ...formData, idopstina: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opis *
                </label>
                <input
                  type="text"
                  value={formData.opis}
                  onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Unesite naziv lokacije..."
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
