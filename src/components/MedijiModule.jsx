import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { Edit, Plus, Tv, ArrowUp, ArrowDown, Search, X, Archive, ArchiveRestore, Calendar, Eye, EyeOff } from 'lucide-react'

export default function MedijiModule() {
  const [mediji, setMediji] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMedij, setEditingMedij] = useState(null)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterValue, setFilterValue] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [formData, setFormData] = useState({
    opis: ''
  })

  useEffect(() => {
    loadMediji()
  }, [showArchived])

  const loadMediji = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('mediji')
        .select('*')
        .order('datumkreiranja', { ascending: false })

      if (!showArchived) {
        query = query.or('stsarhiva.is.null,stsarhiva.eq.false')
      }

      const { data, error } = await query

      if (error) throw error

      setMediji(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju medija:', error)
      alert('Greška pri učitavanju medija: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (id, currentStatus) => {
    const newStatus = !currentStatus
    const action = newStatus ? 'arhivirati' : 'dearhivirati'
    
    if (!window.confirm(`Da li ste sigurni da želite da ${action} ovaj medij?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('mediji')
        .update({ 
          stsarhiva: newStatus,
          datumpromene: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      loadMediji()
    } catch (error) {
      console.error('Greška pri arhiviranju:', error)
      alert('Greška pri arhiviranju medija: ' + error.message)
    }
  }

  const handleEdit = (medij) => {
    setEditingMedij(medij)
    setFormData({
      opis: medij.opis || ''
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingMedij(null)
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
      if (editingMedij) {
        const { error } = await supabase
          .from('mediji')
          .update({ 
            opis: formData.opis.trim(),
            datumpromene: new Date().toISOString()
          })
          .eq('id', editingMedij.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('mediji')
          .insert([{ 
            opis: formData.opis.trim(),
            datumkreiranja: new Date().toISOString(),
            stsarhiva: false
          }])

        if (error) throw error
      }

      setShowForm(false)
      loadMediji()
    } catch (error) {
      console.error('Greška pri čuvanju medija:', error)
      alert('Greška pri čuvanju medija: ' + error.message)
    }
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setFilterValue('')
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
      'opis': 'Opisu',
      'datumkreiranja': 'Datumu kreiranja',
      'datumpromene': 'Datumu promene'
    }
    return labels[column] || column
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredAndSortedData = useMemo(() => {
    let data = [...mediji]

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
  }, [mediji, sortColumn, sortDirection, filterValue])

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
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Mediji</h2>
          <p className="text-gray-500 mt-1">Upravljanje medijima</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl transition-all duration-200 font-medium border ${
              showArchived 
                ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {showArchived ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            <span>{showArchived ? 'Sakrij arhivirane' : 'Prikaži arhivirane'}</span>
          </button>
          <button
            onClick={handleAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Dodaj medij</span>
          </button>
        </div>
      </div>

      {mediji.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Tv className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">
            {showArchived ? 'Nema arhiviranih medija' : 'Nema medija'}
          </p>
          <p className="text-gray-500 mb-6">
            {showArchived ? 'Nema arhiviranih medija za prikaz' : 'Dodajte prvi medij'}
          </p>
          {!showArchived && (
            <button
              onClick={handleAdd}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
            >
              Dodaj medij
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Filter input */}
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
                    onClick={() => handleSort('opis')}
                  >
                    <div className="flex items-center">
                      Opis
                      {getSortIcon('opis')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors"
                    onClick={() => handleSort('datumkreiranja')}
                  >
                    <div className="flex items-center">
                      Datum kreiranja
                      {getSortIcon('datumkreiranja')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors"
                    onClick={() => handleSort('datumpromene')}
                  >
                    <div className="flex items-center">
                      Datum promene
                      {getSortIcon('datumpromene')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedData.map((medij) => (
                  <tr 
                    key={medij.id} 
                    className={`hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200 ${
                      medij.stsarhiva ? 'bg-gray-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">
                        {medij.id}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium ${medij.stsarhiva ? 'text-gray-400' : 'text-gray-900'}`}>
                      {medij.opis}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(medij.datumkreiranja)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {medij.datumpromene ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(medij.datumpromene)}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {medij.stsarhiva ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full">
                          <Archive className="w-3 h-3" />
                          Arhivirano
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                          Aktivno
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(medij)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden lg:inline">Izmeni</span>
                        </button>
                        <button
                          onClick={() => handleArchive(medij.id, medij.stsarhiva)}
                          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl transition-all duration-200 shadow-md ${
                            medij.stsarhiva 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-green-500/20'
                              : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-gray-500/20'
                          }`}
                        >
                          {medij.stsarhiva ? (
                            <>
                              <ArchiveRestore className="w-4 h-4" />
                              <span className="hidden lg:inline">Dearhiviraj</span>
                            </>
                          ) : (
                            <>
                              <Archive className="w-4 h-4" />
                              <span className="hidden lg:inline">Arhiviraj</span>
                            </>
                          )}
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
            {filteredAndSortedData.map((medij) => (
              <div 
                key={medij.id} 
                className={`p-4 hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200 ${
                  medij.stsarhiva ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">
                        ID: {medij.id}
                      </span>
                      {medij.stsarhiva ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full">
                          <Archive className="w-3 h-3" />
                          Arhivirano
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                          Aktivno
                        </span>
                      )}
                    </div>
                    <div className={`text-sm font-medium ${medij.stsarhiva ? 'text-gray-400' : 'text-gray-900'}`}>
                      {medij.opis}
                    </div>
                    <div className="flex flex-col gap-1 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Kreirano: {formatDate(medij.datumkreiranja)}
                      </div>
                      {medij.datumpromene && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Promenjeno: {formatDate(medij.datumpromene)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(medij)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Izmeni
                  </button>
                  <button
                    onClick={() => handleArchive(medij.id, medij.stsarhiva)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md text-sm font-medium ${
                      medij.stsarhiva 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-green-500/20'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-gray-500/20'
                    }`}
                  >
                    {medij.stsarhiva ? (
                      <>
                        <ArchiveRestore className="w-4 h-4" />
                        Dearhiviraj
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4" />
                        Arhiviraj
                      </>
                    )}
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
                  <Tv className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {editingMedij ? 'Izmeni medij' : 'Dodaj novi medij'}
                </h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                  placeholder="Unesite opis medija..."
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
                  {editingMedij ? 'Sačuvaj izmene' : 'Kreiraj medij'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
