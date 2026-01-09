import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../utils/supabase'
import { Edit, Trash2, Plus, Building, ArrowUp, ArrowDown, Search, X } from 'lucide-react'

export default function GradModule() {
  const [gradovi, setGradovi] = useState([])
  const [drzave, setDrzave] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGrad, setEditingGrad] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterValue, setFilterValue] = useState('')
  const [formData, setFormData] = useState({
    opis: '',
    iddrzave: ''
  })

  useEffect(() => {
    loadGradovi()
    loadDrzave()
  }, [])

  const loadDrzave = async () => {
    try {
      const { data, error } = await supabase
        .from('drzava')
        .select('*')
        .order('opis', { ascending: true })

      if (error) throw error
      setDrzave(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju država:', error)
    }
  }

  const loadGradovi = async () => {
    try {
      setLoading(true)
      // Prvo probaj sa svim kolonama
      const { data, error } = await supabase
        .from('grad')
        .select('*')
        .order('opis', { ascending: true })

      if (error) {
        console.error('Greška pri učitavanju gradova:', error)
        alert('Greška pri učitavanju gradova: ' + error.message)
        return
      }

      setGradovi(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju gradova:', error)
      alert('Greška pri učitavanju gradova: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovaj grad?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('grad')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadGradovi()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju grada: ' + error.message)
    }
  }

  const handleEdit = (grad) => {
    setEditingGrad(grad)
    setFormData({
      opis: grad.opis || '',
      iddrzave: grad.iddrzave || ''
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingGrad(null)
    setFormData({
      opis: '',
      iddrzave: drzave.length > 0 ? drzave[0].id : ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.opis.trim()) {
      alert('Opis je obavezan')
      return
    }

    if (!formData.iddrzave) {
      alert('Država je obavezna')
      return
    }

    try {
      const updateData = {
        opis: formData.opis.trim(),
        iddrzave: parseInt(formData.iddrzave)
      }

      if (editingGrad) {
        const { error } = await supabase
          .from('grad')
          .update(updateData)
          .eq('id', editingGrad.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('grad')
          .insert([updateData])

        if (error) throw error
      }

      setShowForm(false)
      loadGradovi()
    } catch (error) {
      console.error('Greška pri čuvanju grada:', error)
      alert('Greška pri čuvanju grada: ' + error.message)
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
    let data = [...gradovi]

    // Filtriranje
    if (filterValue && sortColumn) {
      const filterLower = filterValue.toLowerCase()
      data = data.filter((item) => {
        let value = item[sortColumn]
        // Za foreign key kolone, koristi opis iz referentne tabele
        if (sortColumn === 'iddrzave') {
          const drzava = drzave.find(d => d.id === item.iddrzave)
          value = drzava?.opis || ''
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
        if (sortColumn === 'iddrzave') {
          const drzavaA = drzave.find(d => d.id === a.iddrzave)
          const drzavaB = drzave.find(d => d.id === b.iddrzave)
          aVal = drzavaA?.opis || ''
          bVal = drzavaB?.opis || ''
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
  }, [gradovi, drzave, sortColumn, sortDirection, filterValue])

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
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Gradovi</h3>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={drzave.length === 0}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Dodaj grad</span>
          <span className="sm:hidden">Dodaj</span>
        </button>
      </div>

      {drzave.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Morate prvo dodati državu pre dodavanja gradova.</p>
        </div>
      )}

      {gradovi.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nema gradova</p>
          <p className="text-gray-500 mb-4">Dodajte prvi grad</p>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            disabled={drzave.length === 0}
          >
            Dodaj grad
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
                  placeholder={`Pretraži po ${sortColumn === 'id' ? 'ID' : sortColumn === 'opis' ? 'Opisu' : 'Državi'}...`}
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
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('iddrzave')}
                  >
                    <div className="flex items-center">
                      Država
                      {getSortIcon('iddrzave')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedData.map((grad) => {
                  const drzavaOpis = drzave.find(d => d.id === grad.iddrzave)?.opis || 'N/A'
                  return (
                    <tr key={grad.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {grad.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {grad.opis}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {drzavaOpis}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(grad)}
                            className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Izmeni
                          </button>
                          <button
                            onClick={() => handleDelete(grad.id)}
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
          
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredAndSortedData.map((grad) => {
              const drzavaOpis = drzave.find(d => d.id === grad.iddrzave)?.opis || 'N/A'
              return (
                <div key={grad.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">ID: {grad.id}</div>
                      <div className="text-sm font-medium text-gray-900 mb-1">{grad.opis}</div>
                      <div className="text-xs text-gray-500">Država: {drzavaOpis}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(grad)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Izmeni
                    </button>
                    <button
                      onClick={() => handleDelete(grad.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {editingGrad ? 'Izmeni grad' : 'Dodaj novi grad'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Država *
                </label>
                <select
                  value={formData.iddrzave}
                  onChange={(e) => setFormData({ ...formData, iddrzave: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Izaberi državu</option>
                  {drzave.map((drzava) => (
                    <option key={drzava.id} value={drzava.id}>
                      {drzava.opis}
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
                  {editingGrad ? 'Sačuvaj izmene' : 'Kreiraj grad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
