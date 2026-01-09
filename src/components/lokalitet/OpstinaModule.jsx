import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../utils/supabase'
import { Edit, Trash2, Plus, Map, ArrowUp, ArrowDown, Search, X } from 'lucide-react'

export default function OpstinaModule() {
  const [opstine, setOpstine] = useState([])
  const [gradovi, setGradovi] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOpstina, setEditingOpstina] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterValue, setFilterValue] = useState('')
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
    let data = [...opstine]

    // Filtriranje
    if (filterValue && sortColumn) {
      const filterLower = filterValue.toLowerCase()
      data = data.filter((item) => {
        let value = item[sortColumn]
        // Za foreign key kolone, koristi opis iz referentne tabele
        if (sortColumn === 'idgrad') {
          const grad = gradovi.find(g => g.id === item.idgrad)
          value = grad?.opis || ''
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
        if (sortColumn === 'idgrad') {
          const gradA = gradovi.find(g => g.id === a.idgrad)
          const gradB = gradovi.find(g => g.id === b.idgrad)
          aVal = gradA?.opis || ''
          bVal = gradB?.opis || ''
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
  }, [opstine, gradovi, sortColumn, sortDirection, filterValue])

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
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Opštine</h3>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={gradovi.length === 0}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Dodaj opštinu</span>
          <span className="sm:hidden">Dodaj</span>
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
          {/* Filter input - prikazuje se samo kada je sortColumn postavljen */}
          {sortColumn && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  placeholder={`Pretraži po ${sortColumn === 'id' ? 'ID' : sortColumn === 'opis' ? 'Opisu' : 'Gradu'}...`}
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
          <div className="overflow-x-auto">
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
                    onClick={() => handleSort('idgrad')}
                  >
                    <div className="flex items-center">
                      Grad
                      {getSortIcon('idgrad')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedData.map((opstina) => {
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
          
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredAndSortedData.map((opstina) => {
              const gradOpis = gradovi.find(g => g.id === opstina.idgrad)?.opis || 'N/A'
              return (
                <div key={opstina.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">ID: {opstina.id}</div>
                      <div className="text-sm font-medium text-gray-900 mb-1">{opstina.opis}</div>
                      <div className="text-xs text-gray-500">Grad: {gradOpis}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(opstina)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Izmeni
                    </button>
                    <button
                      onClick={() => handleDelete(opstina.id)}
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
                {editingOpstina ? 'Izmeni opštinu' : 'Dodaj novu opštinu'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grad *
                </label>
                <select
                  value={formData.idgrad}
                  onChange={(e) => setFormData({ ...formData, idgrad: e.target.value })}
                  required
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
