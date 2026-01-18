import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Search, X, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter, RotateCcw, Pencil, Archive, ArchiveRestore, MoreVertical, Phone, Calendar, MessageSquare, User, Home, FileSearch } from 'lucide-react'
import PozivForm from './PozivForm'

export default function PoziviModule() {
  console.log('🔵 PoziviModule montiran')
  const [pozivi, setPozivi] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingPoziv, setEditingPoziv] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [openActionMenu, setOpenActionMenu] = useState(null)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Sortiranje i pretraga po kolonama
  const [sortConfig, setSortConfig] = useState({ key: 'datumkreiranja', direction: 'desc' })
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    kupac: '',
    prodavac: '',
    komentar: '',
    stspoziv: ''
  })
  
  const [filters, setFilters] = useState({
    stspoziv: '',
    stsaktivan: true,
    dateFrom: '',
    dateTo: ''
  })

  // Status poziva opcije
  const statusOptions = [
    { value: 'novikupac', label: 'Novi kupac', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'starikupac', label: 'Stari kupac', color: 'bg-blue-100 text-blue-800' },
    { value: 'prodavac', label: 'Prodavac', color: 'bg-amber-100 text-amber-800' },
    { value: 'agencija', label: 'Agencija', color: 'bg-purple-100 text-purple-800' },
    { value: 'ostalo', label: 'Ostalo', color: 'bg-gray-100 text-gray-800' }
  ]

  useEffect(() => {
    loadPozivi()
  }, [])

  const loadPozivi = async () => {
    try {
      console.log('📊 PoziviModule: Početak učitavanja poziva')
      setLoading(true)
      
      let query = supabase
        .from('pozivi')
        .select(`
          id,
          datumkreiranja,
          datumpromene,
          idponude,
          idtraznja,
          stspoziv,
          komentar,
          iduser,
          ai_karakteristike,
          arhiviran
        `)

      // Primeni filtere
      if (filters.stsaktivan !== null && filters.stsaktivan !== undefined && filters.stsaktivan !== '') {
        if (filters.stsaktivan === true) {
          query = query.or('arhiviran.is.null,arhiviran.eq.false')
        } else {
          query = query.eq('arhiviran', true)
        }
      }
      if (filters.stspoziv) {
        query = query.eq('stspoziv', filters.stspoziv)
      }
      if (filters.dateFrom) {
        query = query.gte('datumkreiranja', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('datumkreiranja', filters.dateTo + 'T23:59:59')
      }

      const { data, error } = await query.order('datumkreiranja', { ascending: false })

      if (error) throw error

      // Učitaj relacije
      const ponudaIds = [...new Set((data || []).map(p => p.idponude).filter(Boolean))]
      const traznjaIds = [...new Set((data || []).map(p => p.idtraznja).filter(Boolean))]
      const userIds = [...new Set((data || []).map(p => p.iduser).filter(Boolean))]

      const [ponudeResult, traznjeResult, korisniciResult] = await Promise.all([
        ponudaIds.length > 0 ? supabase.from('ponuda').select('id, kontaktosoba, naslovaoglasa').in('id', ponudaIds) : Promise.resolve({ data: [] }),
        traznjaIds.length > 0 ? supabase.from('traznja').select('id, kontaktosoba, kontakttelefon').in('id', traznjaIds) : Promise.resolve({ data: [] }),
        userIds.length > 0 ? supabase.from('korisnici').select('id, naziv, email').in('id', userIds) : Promise.resolve({ data: [] })
      ])

      const ponudeMap = new Map((ponudeResult.data || []).map(p => [p.id, p]))
      const traznjeMap = new Map((traznjeResult.data || []).map(t => [t.id, t]))
      const korisniciMap = new Map((korisniciResult.data || []).map(k => [k.id, k]))

      const poziviSaRelacijama = (data || []).map(poziv => ({
        ...poziv,
        ponuda: poziv.idponude ? ponudeMap.get(poziv.idponude) || null : null,
        traznja: poziv.idtraznja ? traznjeMap.get(poziv.idtraznja) || null : null,
        korisnik: poziv.iduser ? korisniciMap.get(poziv.iduser) || null : null
      }))

      setPozivi(poziviSaRelacijama)
    } catch (error) {
      console.error('Greška pri učitavanju poziva:', error)
      alert('Greška pri učitavanju poziva: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadPozivi()
    setShowFilters(false)
  }

  const resetFilters = () => {
    setFilters({
      stspoziv: '',
      stsaktivan: true,
      dateFrom: '',
      dateTo: ''
    })
  }

  const activeFiltersCount = [
    filters.stspoziv,
    filters.dateFrom,
    filters.dateTo
  ].filter(Boolean).length

  const formatDatum = (datum) => {
    if (!datum) return '-'
    return new Date(datum).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDatumVreme = (datum) => {
    if (!datum) return '-'
    return new Date(datum).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Učitavanje poziva...</p>
        </div>
      </div>
    )
  }

  // Funkcija za sortiranje
  const handleSort = (key) => {
    let newDirection = 'asc'
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') newDirection = 'desc'
      else if (sortConfig.direction === 'desc') newDirection = null
    }
    setSortConfig({ key: newDirection ? key : null, direction: newDirection })
  }

  const handleColumnFilterChange = (key, value) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }))
  }

  // Filtrirani i sortirani podaci
  const getFilteredAndSortedPozivi = () => {
    let result = [...pozivi]

    // Filtriranje po kolonama
    if (columnFilters.id) {
      result = result.filter(p => String(p.id).includes(columnFilters.id))
    }
    if (columnFilters.kupac) {
      result = result.filter(p => 
        p.traznja?.kontaktosoba?.toLowerCase().includes(columnFilters.kupac.toLowerCase())
      )
    }
    if (columnFilters.prodavac) {
      result = result.filter(p => 
        p.ponuda?.kontaktosoba?.toLowerCase().includes(columnFilters.prodavac.toLowerCase())
      )
    }
    if (columnFilters.komentar) {
      result = result.filter(p => 
        p.komentar?.toLowerCase().includes(columnFilters.komentar.toLowerCase())
      )
    }
    if (columnFilters.stspoziv) {
      result = result.filter(p => 
        p.stspoziv?.toLowerCase().includes(columnFilters.stspoziv.toLowerCase())
      )
    }

    // Sortiranje
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aVal, bVal

        switch (sortConfig.key) {
          case 'id':
            aVal = a.id
            bVal = b.id
            break
          case 'datumkreiranja':
            aVal = new Date(a.datumkreiranja || 0).getTime()
            bVal = new Date(b.datumkreiranja || 0).getTime()
            break
          case 'kupac':
            aVal = a.traznja?.kontaktosoba || ''
            bVal = b.traznja?.kontaktosoba || ''
            break
          case 'prodavac':
            aVal = a.ponuda?.kontaktosoba || ''
            bVal = b.ponuda?.kontaktosoba || ''
            break
          case 'stspoziv':
            aVal = a.stspoziv || ''
            bVal = b.stspoziv || ''
            break
          default:
            return 0
        }

        if (typeof aVal === 'string') {
          const comparison = aVal.localeCompare(bVal, 'sr')
          return sortConfig.direction === 'asc' ? comparison : -comparison
        }

        if (sortConfig.direction === 'asc') {
          return aVal - bVal
        }
        return bVal - aVal
      })
    }

    return result
  }
  
  const filteredAndSortedPozivi = getFilteredAndSortedPozivi()

  const totalPozivi = filteredAndSortedPozivi.length
  const totalPages = Math.ceil(totalPozivi / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPozivi = filteredAndSortedPozivi.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleAddPoziv = () => {
    setEditingPoziv(null)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingPoziv(null)
    loadPozivi()
  }

  // Arhiviraj poziv
  const handleArhiviraj = async (pozivId) => {
    if (!confirm('Da li želite da arhivirate ovaj poziv?')) return
    
    try {
      const { error } = await supabase
        .from('pozivi')
        .update({ 
          arhiviran: true,
          datumpromene: new Date().toISOString()
        })
        .eq('id', pozivId)

      if (error) throw error
      
      loadPozivi()
      setOpenActionMenu(null)
    } catch (error) {
      console.error('Greška pri arhiviranju:', error)
      alert('Greška pri arhiviranju poziva: ' + error.message)
    }
  }

  // Dearhiviraj poziv
  const handleDearhiviraj = async (pozivId) => {
    if (!confirm('Da li želite da dearhivirate ovaj poziv?')) return
    
    try {
      const { error } = await supabase
        .from('pozivi')
        .update({ 
          arhiviran: false,
          datumpromene: new Date().toISOString()
        })
        .eq('id', pozivId)

      if (error) throw error
      
      loadPozivi()
      setOpenActionMenu(null)
    } catch (error) {
      console.error('Greška pri dearhiviranju:', error)
      alert('Greška pri dearhiviranju poziva: ' + error.message)
    }
  }

  const getStatusColor = (status) => {
    const option = statusOptions.find(o => o.value === status)
    return option?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const option = statusOptions.find(o => o.value === status)
    return option?.label || status || '-'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Pozivi</h2>
          <p className="text-gray-500 text-sm mt-1">Upravljanje pozivima i kontaktima</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleAddPoziv}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Dodaj poziv</span>
            <span className="sm:hidden">Dodaj</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all font-medium ${
              showFilters
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filteri</span>
            {activeFiltersCount > 0 && (
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Pretraga poziva</h3>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status poziva */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status poziva</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFilterChange('stspoziv', '')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filters.stspoziv === ''
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Svi
                  </button>
                  {statusOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('stspoziv', option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.stspoziv === option.value
                          ? option.color + ' ring-2 ring-offset-1 ring-gray-400'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status: Aktivni/Arhivirani */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange('stsaktivan', true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    filters.stsaktivan === true
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${filters.stsaktivan === true ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                  Aktivni
                </button>
                <button
                  onClick={() => handleFilterChange('stsaktivan', false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    filters.stsaktivan === false
                      ? 'bg-gray-300 text-gray-700 border border-gray-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${filters.stsaktivan === false ? 'bg-gray-500' : 'bg-gray-400'}`}></span>
                  Arhivirani
                </button>
              </div>

              {/* Datum od-do */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Datum od</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Datum do</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Footer sa dugmadima */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Resetuj filtere
              </button>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-all disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
                {loading ? 'Pretražujem...' : 'Prikaži pozive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {pozivi.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Phone className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-2xl font-bold mb-2">Nema poziva</p>
          <p className="text-gray-500">Nema poziva koji odgovaraju vašim kriterijumima.</p>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-900 to-black text-white">
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider w-16 cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      {sortConfig.key === 'id' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('datumkreiranja')}
                  >
                    <div className="flex items-center gap-1">
                      Datum
                      {sortConfig.key === 'datumkreiranja' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('kupac')}
                  >
                    <div className="flex items-center gap-1">
                      Kupac
                      {sortConfig.key === 'kupac' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('prodavac')}
                  >
                    <div className="flex items-center gap-1">
                      Prodavac
                      {sortConfig.key === 'prodavac' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Komentar</th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('stspoziv')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortConfig.key === 'stspoziv' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider w-10"></th>
                </tr>
                {/* Red sa filterima */}
                <tr className="bg-gray-800/90">
                  <th className="px-4 py-2">
                    <input
                      type="text"
                      value={columnFilters.id}
                      onChange={(e) => handleColumnFilterChange('id', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-4 py-2"></th>
                  <th className="px-4 py-2">
                    <input
                      type="text"
                      value={columnFilters.kupac}
                      onChange={(e) => handleColumnFilterChange('kupac', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-4 py-2">
                    <input
                      type="text"
                      value={columnFilters.prodavac}
                      onChange={(e) => handleColumnFilterChange('prodavac', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-4 py-2">
                    <input
                      type="text"
                      value={columnFilters.komentar}
                      onChange={(e) => handleColumnFilterChange('komentar', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-4 py-2">
                    <input
                      type="text"
                      value={columnFilters.stspoziv}
                      onChange={(e) => handleColumnFilterChange('stspoziv', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedPozivi.map((poziv, index) => (
                  <tr 
                    key={poziv.id} 
                    className={`
                      hover:bg-amber-50 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-amber-500
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    `}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center min-w-[40px] h-7 bg-gradient-to-r from-gray-900 to-black text-white text-xs font-bold rounded-lg px-2">
                        {poziv.id}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{formatDatum(poziv.datumkreiranja)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                          <FileSearch className="w-4 h-4 text-blue-700" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900 block">
                            {poziv.traznja?.kontaktosoba || '-'}
                          </span>
                          {poziv.traznja?.kontakttelefon && (
                            <span className="text-xs text-gray-500">{poziv.traznja.kontakttelefon}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                          <Home className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900 block">
                            {poziv.ponuda?.kontaktosoba || '-'}
                          </span>
                          {poziv.ponuda?.naslovaoglasa && (
                            <span className="text-xs text-gray-500 truncate max-w-[150px] block">{poziv.ponuda.naslovaoglasa}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2 max-w-xs">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 line-clamp-2">
                          {poziv.komentar || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${getStatusColor(poziv.stspoziv)}`}>
                        {getStatusLabel(poziv.stspoziv)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenActionMenu(openActionMenu === poziv.id ? null : poziv.id)
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl transition-all"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {/* Dropdown meni */}
                        {openActionMenu === poziv.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setOpenActionMenu(null)}
                            />
                            <div className={`absolute right-0 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 ${
                              index >= paginatedPozivi.length - 2 
                                ? 'bottom-full mb-2' 
                                : 'top-full mt-2'
                            }`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingPoziv(poziv)
                                  setShowForm(true)
                                  setOpenActionMenu(null)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                                Promeni
                              </button>
                              {!poziv.arhiviran ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleArhiviraj(poziv.id)
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                >
                                  <Archive className="w-4 h-4" />
                                  Arhiviraj
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDearhiviraj(poziv.id)
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                                >
                                  <ArchiveRestore className="w-4 h-4" />
                                  Dearhiviraj
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Prikaži:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent backdrop-blur-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <span className="text-sm font-bold text-amber-400">{currentPage}</span>
                <span className="text-gray-500">/</span>
                <span className="text-sm text-gray-400">{totalPages || 1}</span>
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="text-sm text-gray-400 font-medium">
              Ukupno: <span className="text-amber-400 font-bold">{totalPozivi}</span> poziva
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <PozivForm
          poziv={editingPoziv}
          onClose={() => {
            setShowForm(false)
            setEditingPoziv(null)
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
