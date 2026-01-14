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

  const filteredAndSortedData = useMemo(() => {
    let data = [...ulice]

    if (filterValue && sortColumn) {
      const filterLower = filterValue.toLowerCase()
      data = data.filter((item) => {
        let value = item[sortColumn]
        if (sortColumn === 'idlokacija') {
          const lokacija = lokacije.find(l => l.id === item.idlokacija)
          value = lokacija?.opis || ''
        }
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(filterLower)
      })
    }

    if (sortColumn) {
      data.sort((a, b) => {
        let aVal = a[sortColumn]
        let bVal = b[sortColumn]

        if (sortColumn === 'idlokacija') {
          const lokacijaA = lokacije.find(l => l.id === a.idlokacija)
          const lokacijaB = lokacije.find(l => l.id === b.idlokacija)
          aVal = lokacijaA?.opis || ''
          bVal = lokacijaB?.opis || ''
        }

        if (aVal === null || aVal === undefined) aVal = ''
        if (bVal === null || bVal === undefined) bVal = ''

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Ulice</h2>
          <p className="text-gray-500 mt-1">Upravljanje ulicama</p>
        </div>
        <button
          onClick={handleAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={lokacije.length === 0}
        >
          <Plus className="w-5 h-5" />
          <span>Dodaj ulicu</span>
        </button>
      </div>

      {lokacije.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-800 font-medium">Morate prvo dodati lokaciju pre dodavanja ulica.</p>
        </div>
      )}

      {ulice.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Navigation className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-xl font-semibold mb-2">Nema ulica</p>
          <p className="text-gray-500 mb-6">Dodajte prvu ulicu</p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={lokacije.length === 0}
          >
            Dodaj ulicu
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
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
                  placeholder={`Pretraži po ${sortColumn === 'id' ? 'ID' : sortColumn === 'opis' ? 'Opisu' : 'Lokaciji'}...`}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                {filterValue && (
                  <button onClick={() => setFilterValue('')} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" type="button">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-900 to-black">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors" onClick={() => handleSort('id')}>
                    <div className="flex items-center">ID{getSortIcon('id')}</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors" onClick={() => handleSort('opis')}>
                    <div className="flex items-center">Opis{getSortIcon('opis')}</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 select-none transition-colors" onClick={() => handleSort('idlokacija')}>
                    <div className="flex items-center">Lokacija{getSortIcon('idlokacija')}</div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedData.map((ulica) => {
                  const lokacijaOpis = lokacije.find(l => l.id === ulica.idlokacija)?.opis || 'N/A'
                  return (
                    <tr key={ulica.id} className="hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg">{ulica.id}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{ulica.opis}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{lokacijaOpis}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(ulica)} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20">
                            <Edit className="w-4 h-4" /><span className="hidden lg:inline">Izmeni</span>
                          </button>
                          <button onClick={() => handleDelete(ulica.id)} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20">
                            <Trash2 className="w-4 h-4" /><span className="hidden lg:inline">Obriši</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <div className="md:hidden divide-y divide-gray-100">
            {filteredAndSortedData.map((ulica) => {
              const lokacijaOpis = lokacije.find(l => l.id === ulica.idlokacija)?.opis || 'N/A'
              return (
                <div key={ulica.id} className="p-4 hover:bg-amber-50 border-l-4 border-l-transparent hover:border-l-amber-500 transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-black rounded-lg mb-2">ID: {ulica.id}</span>
                      <div className="text-sm font-medium text-gray-900 mb-1">{ulica.opis}</div>
                      <div className="text-xs text-gray-500">Lokacija: {lokacijaOpis}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleEdit(ulica)} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md shadow-amber-500/20 text-sm font-medium">
                      <Edit className="w-4 h-4" />Izmeni
                    </button>
                    <button onClick={() => handleDelete(ulica.id)} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20 text-sm font-medium">
                      <Trash2 className="w-4 h-4" />Obriši
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md my-auto">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{editingUlica ? 'Izmeni ulicu' : 'Dodaj novu ulicu'}</h3>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lokacija *</label>
                <select value={formData.idlokacija} onChange={(e) => setFormData({ ...formData, idlokacija: e.target.value })} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all">
                  <option value="">Izaberi lokaciju</option>
                  {lokacije.map((lokacija) => (<option key={lokacija.id} value={lokacija.id}>{lokacija.opis}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Opis *</label>
                <input type="text" value={formData.opis} onChange={(e) => setFormData({ ...formData, opis: e.target.value })} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" placeholder="Unesite naziv ulice..." />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="w-full sm:w-auto px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium">Otkaži</button>
                <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium">{editingUlica ? 'Sačuvaj izmene' : 'Kreiraj ulicu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
