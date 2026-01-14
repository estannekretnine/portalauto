import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Search, X, Grid, List, Image as ImageIcon, MapPin, Home, Ruler, Plus, ChevronLeft, ChevronRight, Filter, RotateCcw, Building2, Euro, Pencil } from 'lucide-react'
import PonudaForm from './PonudaForm'

export default function PonudeModule() {
  console.log('🔵 PonudeModule montiran')
  const [ponude, setPonude] = useState([])
  const [vrsteObjekata, setVrsteObjekata] = useState([])
  const [lokacije, setLokacije] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('table')
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingPonuda, setEditingPonuda] = useState(null) // Ponuda koja se uređuje
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [filters, setFilters] = useState({
    idvrstaobjekta: '',
    kvadraturaOd: '',
    kvadraturaDo: '',
    strukturaOd: '',
    strukturaDo: '',
    cenaOd: '',
    cenaDo: '',
    idlokacija: [],
    stsaktivan: true,
    stsrentaprodaja: 'prodaja'
  })

  useEffect(() => {
    loadVrsteObjekata()
    loadLokacije()
    loadPonude()
  }, [])

  const loadVrsteObjekata = async () => {
    try {
      const { data, error } = await supabase
        .from('vrstaobjekta')
        .select('*')
        .order('opis', { ascending: true })

      if (error) throw error
      setVrsteObjekata(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju vrsta objekata:', error)
    }
  }

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

  const loadPonude = async () => {
    try {
      console.log('📊 PonudeModule: Početak učitavanja ponuda')
      setLoading(true)
      
      let query = supabase
        .from('ponuda')
        .select(`
          id,
          idvrstaobjekta,
          idopstina,
          idlokacija,
          idulica,
          kvadratura,
          struktura,
          cena,
          stsaktivan,
          stsrentaprodaja
        `)

      if (filters.stsaktivan !== null && filters.stsaktivan !== undefined) {
        query = query.eq('stsaktivan', filters.stsaktivan)
      }
      if (filters.stsrentaprodaja) {
        query = query.eq('stsrentaprodaja', filters.stsrentaprodaja)
      }
      if (filters.idvrstaobjekta) {
        query = query.eq('idvrstaobjekta', filters.idvrstaobjekta)
      }
      if (filters.kvadraturaOd) {
        query = query.gte('kvadratura', parseFloat(filters.kvadraturaOd))
      }
      if (filters.kvadraturaDo) {
        query = query.lte('kvadratura', parseFloat(filters.kvadraturaDo))
      }
      if (filters.strukturaOd) {
        query = query.gte('struktura', parseFloat(filters.strukturaOd))
      }
      if (filters.strukturaDo) {
        query = query.lte('struktura', parseFloat(filters.strukturaDo))
      }
      if (filters.cenaOd) {
        query = query.gte('cena', parseFloat(filters.cenaOd))
      }
      if (filters.cenaDo) {
        query = query.lte('cena', parseFloat(filters.cenaDo))
      }
      if (filters.idlokacija && filters.idlokacija.length > 0) {
        query = query.in('idlokacija', filters.idlokacija)
      }

      const { data, error } = await query.order('id', { ascending: false })

      if (error) throw error

      const vrstaIds = [...new Set((data || []).map(p => p.idvrstaobjekta).filter(Boolean))]
      const opstinaIds = [...new Set((data || []).map(p => p.idopstina).filter(Boolean))]
      const lokacijaIds = [...new Set((data || []).map(p => p.idlokacija).filter(Boolean))]
      const ulicaIds = [...new Set((data || []).map(p => p.idulica).filter(Boolean))]
      const ponudaIds = (data || []).map(p => p.id)

      const [vrsteResult, opstineResult, lokacijeResult, uliceResult, fotografijeResult] = await Promise.all([
        vrstaIds.length > 0 ? supabase.from('vrstaobjekta').select('id, opis').in('id', vrstaIds) : Promise.resolve({ data: [] }),
        opstinaIds.length > 0 ? supabase.from('opstina').select('id, opis').in('id', opstinaIds) : Promise.resolve({ data: [] }),
        lokacijaIds.length > 0 ? supabase.from('lokacija').select('id, opis').in('id', lokacijaIds) : Promise.resolve({ data: [] }),
        ulicaIds.length > 0 ? supabase.from('ulica').select('id, opis').in('id', ulicaIds) : Promise.resolve({ data: [] }),
        ponudaIds.length > 0 ? supabase.from('ponudafoto').select('*').in('idponude', ponudaIds) : Promise.resolve({ data: [] })
      ])

      const vrsteMap = new Map((vrsteResult.data || []).map(v => [v.id, v]))
      const opstineMap = new Map((opstineResult.data || []).map(o => [o.id, o]))
      const lokacijeMap = new Map((lokacijeResult.data || []).map(l => [l.id, l]))
      const uliceMap = new Map((uliceResult.data || []).map(u => [u.id, u]))
      const fotografijeMap = new Map()
      
      if (fotografijeResult.data) {
        fotografijeResult.data.forEach(foto => {
          if (!fotografijeMap.has(foto.idponude)) {
            fotografijeMap.set(foto.idponude, [])
          }
          fotografijeMap.get(foto.idponude).push(foto)
        })
        
        fotografijeMap.forEach((fotos, ponudaId) => {
          fotos.sort((a, b) => {
            if (a.glavna && !b.glavna) return -1
            if (!a.glavna && b.glavna) return 1
            return (a.redosled || 0) - (b.redosled || 0)
          })
        })
      }

      const ponudeSaRelacijama = (data || []).map(ponuda => {
        const fotografijeZaPonudu = fotografijeMap.get(ponuda.id) || []
        
        return {
          ...ponuda,
          vrstaobjekta: ponuda.idvrstaobjekta ? vrsteMap.get(ponuda.idvrstaobjekta) || null : null,
          opstina: ponuda.idopstina ? opstineMap.get(ponuda.idopstina) || null : null,
          lokacija: ponuda.idlokacija ? lokacijeMap.get(ponuda.idlokacija) || null : null,
          ulica: ponuda.idulica ? uliceMap.get(ponuda.idulica) || null : null,
          fotografija: fotografijeZaPonudu.length > 0 ? fotografijeZaPonudu[0] : null
        }
      })

      setPonude(ponudeSaRelacijama)
    } catch (error) {
      console.error('Greška pri učitavanju ponuda:', error)
      alert('Greška pri učitavanju ponuda: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPonude()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleLokacijaToggle = (lokacijaId) => {
    setFilters(prev => {
      const lokacije = prev.idlokacija || []
      if (lokacije.includes(lokacijaId)) {
        return { ...prev, idlokacija: lokacije.filter(id => id !== lokacijaId) }
      } else {
        return { ...prev, idlokacija: [...lokacije, lokacijaId] }
      }
    })
  }

  const resetFilters = () => {
    setFilters({
      idvrstaobjekta: '',
      kvadraturaOd: '',
      kvadraturaDo: '',
      strukturaOd: '',
      strukturaDo: '',
      cenaOd: '',
      cenaDo: '',
      idlokacija: [],
      stsaktivan: true,
      stsrentaprodaja: 'prodaja'
    })
  }

  const formatCena = (cena) => {
    if (!cena) return '-'
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(cena)
  }

  if (loading) {
    console.log('⏳ PonudeModule: Loading state - true')
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Učitavanje ponuda...</p>
        </div>
      </div>
    )
  }
  
  console.log('✅ PonudeModule: Loading complete, ponude count:', ponude.length)

  const totalPonude = ponude.length
  const totalPages = Math.ceil(totalPonude / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPonude = ponude.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleAddPonuda = () => {
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    loadPonude()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Ponude</h2>
          <p className="text-gray-500 text-sm mt-1">Upravljanje nekretninama</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleAddPonuda}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Dodaj ponudu</span>
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
          </button>
          <div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2.5 rounded-xl transition-all ${
                viewMode === 'table'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Tabelarni prikaz"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Grid prikaz"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Pretraga ponuda</h3>
                <p className="text-gray-500 text-sm">Filtrirajte nekretnine po kriterijumima</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Resetuj
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vrsta objekta</label>
              <select
                value={filters.idvrstaobjekta}
                onChange={(e) => handleFilterChange('idvrstaobjekta', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              >
                <option value="">Sve vrste</option>
                {vrsteObjekata.map(vrsta => (
                  <option key={vrsta.id} value={vrsta.id}>{vrsta.opis}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kvadratura od (m²)</label>
              <input
                type="number"
                value={filters.kvadraturaOd}
                onChange={(e) => handleFilterChange('kvadraturaOd', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kvadratura do (m²)</label>
              <input
                type="number"
                value={filters.kvadraturaDo}
                onChange={(e) => handleFilterChange('kvadraturaDo', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="9999"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Struktura od</label>
              <input
                type="number"
                step="0.01"
                value={filters.strukturaOd}
                onChange={(e) => handleFilterChange('strukturaOd', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Struktura do</label>
              <input
                type="number"
                step="0.01"
                value={filters.strukturaDo}
                onChange={(e) => handleFilterChange('strukturaDo', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="9999"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cena od (EUR)</label>
              <input
                type="number"
                value={filters.cenaOd}
                onChange={(e) => handleFilterChange('cenaOd', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cena do (EUR)</label>
              <input
                type="number"
                value={filters.cenaDo}
                onChange={(e) => handleFilterChange('cenaDo', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="999999999"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filters.stsaktivan ? 'true' : 'false'}
                onChange={(e) => handleFilterChange('stsaktivan', e.target.value === 'true')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              >
                <option value="true">Aktivan</option>
                <option value="false">Neaktivan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tip</label>
              <select
                value={filters.stsrentaprodaja}
                onChange={(e) => handleFilterChange('stsrentaprodaja', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              >
                <option value="prodaja">Prodaja</option>
                <option value="renta">Renta</option>
                <option value="">Sve</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lokacije</label>
              <div className="max-h-40 overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl p-4">
                {lokacije.length === 0 ? (
                  <p className="text-sm text-gray-500">Nema dostupnih lokacija</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {lokacije.map(lokacija => (
                      <label key={lokacija.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2.5 rounded-xl transition-colors">
                        <input
                          type="checkbox"
                          checked={filters.idlokacija?.includes(lokacija.id) || false}
                          onChange={() => handleLokacijaToggle(lokacija.id)}
                          className="rounded-lg border-gray-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">{lokacija.opis}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {filters.idlokacija && filters.idlokacija.length > 0 && (
                <p className="text-xs text-amber-600 mt-2 font-medium">Izabrano: {filters.idlokacija.length} lokacija</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {ponude.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Home className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-2xl font-bold mb-2">Nema ponuda</p>
          <p className="text-gray-500">Nema ponuda koje odgovaraju vašim kriterijumima.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View - Compass Style */
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-900 to-black text-white">
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">ID</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Vrsta</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Opština</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Lokacija</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Ulica</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">m²</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Struktura</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Cena</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider">Tip</th>
                  <th className="px-6 py-5 text-center text-xs font-bold uppercase tracking-wider">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPonude.map((ponuda, index) => (
                  <tr 
                    key={ponuda.id} 
                    className={`
                      hover:bg-amber-50 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-amber-500
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-10 h-7 bg-gradient-to-r from-gray-900 to-black text-white text-xs font-bold rounded-lg">
                        {ponuda.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-amber-700" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{ponuda.vrstaobjekta?.opis || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{ponuda.opstina?.opis || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-gray-700">{ponuda.lokacija?.opis || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ponuda.ulica?.opis || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-900">{ponuda.kvadratura ? `${ponuda.kvadratura}` : '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700">
                        {ponuda.struktura ? parseFloat(ponuda.struktura).toFixed(1) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Euro className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-bold text-gray-900">{ponuda.cena ? new Intl.NumberFormat('sr-RS').format(ponuda.cena) : '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
                        ponuda.stsaktivan
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${ponuda.stsaktivan ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        {ponuda.stsaktivan ? 'Aktivan' : 'Neaktivan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                        ponuda.stsrentaprodaja === 'prodaja'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ponuda.stsrentaprodaja === 'prodaja' ? '🏠 Prodaja' : '🔑 Renta'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingPonuda(ponuda)
                          setShowForm(true)
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
                      >
                        <Pencil className="w-4 h-4" />
                        Promeni
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination - Compass Style */}
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
              Ukupno: <span className="text-amber-400 font-bold">{totalPonude}</span> nekretnina
            </div>
          </div>
        </div>
      ) : (
        /* Grid View - Compass Style */
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedPonude.map((ponuda) => (
              <div
                key={ponuda.id}
                className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-amber-200 transition-all duration-300 cursor-pointer group"
              >
                {/* Image */}
                <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {ponuda.fotografija?.url ? (
                    <img
                      src={ponuda.fotografija.url}
                      alt={ponuda.fotografija.opis || 'Ponuda'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="18" fill="%2394a3b8" text-anchor="middle" dy=".3em"%3ENema slike%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Price badge */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-gray-900 to-black backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-lg">
                    <Euro className="w-4 h-4 text-amber-400" />
                    {ponuda.cena ? new Intl.NumberFormat('sr-RS').format(ponuda.cena) : '-'}
                  </div>
                  
                  {/* Type badge */}
                  <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg ${
                    ponuda.stsrentaprodaja === 'prodaja'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                  }`}>
                    {ponuda.stsrentaprodaja === 'prodaja' ? 'Prodaja' : 'Renta'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {ponuda.lokacija?.opis || ponuda.opstina?.opis || '-'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {ponuda.ulica?.opis || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl">
                      <Ruler className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-800">{ponuda.kvadratura || '-'} m²</span>
                    </div>
                    {ponuda.struktura && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-xl">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-800">{parseFloat(ponuda.struktura).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination - Compass Style */}
          <div className="bg-gradient-to-r from-gray-900 to-black rounded-3xl shadow-lg mt-6 px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
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
              Ukupno: <span className="text-amber-400 font-bold">{totalPonude}</span> nekretnina
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <PonudaForm
          ponuda={editingPonuda}
          onClose={() => {
            setShowForm(false)
            setEditingPonuda(null)
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
