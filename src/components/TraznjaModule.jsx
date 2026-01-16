import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { Search, X, MapPin, Home, Ruler, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter, RotateCcw, Euro, Pencil, Archive, ArchiveRestore, MoreVertical, Phone, Calendar, FileText, User, Building2 } from 'lucide-react'
import TraznjaForm from './TraznjaForm'

export default function TraznjaModule() {
  console.log('🔵 TraznjaModule montiran')
  const [traznje, setTraznje] = useState([])
  const [loading, setLoading] = useState(true)
  // Samo tabelarni prikaz - uklonjen viewMode toggle
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTraznja, setEditingTraznja] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [openActionMenu, setOpenActionMenu] = useState(null)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Sortiranje i pretraga po kolonama
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    kontaktosoba: '',
    opstina: '',
    lokacija: '',
    cenado: '',
    kvmod: '',
    kvmdo: ''
  })
  
  // Lokalitet podaci - sve u jednoj listi za autocomplete
  const [sviLokaliteti, setSviLokaliteti] = useState([])
  const [lokalitetSearch, setLokalitetSearch] = useState('')
  const [showLokalitetDropdown, setShowLokalitetDropdown] = useState(false)
  const [selectedLokaliteti, setSelectedLokaliteti] = useState([])
  const lokalitetInputRef = useRef(null)
  
  const [filters, setFilters] = useState({
    cenaOd: '',
    cenaDo: '',
    kvadraturaOd: '',
    kvadraturaDo: '',
    strukturaOd: '',
    strukturaDo: '',
    stsaktivan: true,
    stskupaczakupac: '',
    statuskupca: ''
  })

  useEffect(() => {
    loadLokalitetData()
    loadTraznje()
  }, [])

  const loadLokalitetData = async () => {
    try {
      const [drzaveRes, gradoviRes, opstineRes, lokacijeRes, uliceRes] = await Promise.all([
        supabase.from('drzava').select('*').order('opis'),
        supabase.from('grad').select('*, drzava:iddrzave(id, opis)').order('opis'),
        supabase.from('opstina').select('*, grad:idgrad(id, opis, drzava:iddrzave(id, opis))').order('opis'),
        supabase.from('lokacija').select('*, opstina:idopstina(id, opis, grad:idgrad(id, opis, drzava:iddrzave(id, opis)))').order('opis'),
        supabase.from('ulica').select('*, lokacija:idlokacija(id, opis, opstina:idopstina(id, opis, grad:idgrad(id, opis, drzava:iddrzave(id, opis))))').order('opis')
      ])
      
      const allLokaliteti = []
      
      // Države
      ;(drzaveRes.data || []).forEach(d => {
        allLokaliteti.push({
          id: d.id,
          type: 'drzava',
          opis: d.opis,
          fullPath: d.opis,
          typeLabel: 'Država'
        })
      })
      
      // Gradovi
      ;(gradoviRes.data || []).forEach(g => {
        const drzava = g.drzava?.opis || ''
        allLokaliteti.push({
          id: g.id,
          type: 'grad',
          opis: g.opis,
          fullPath: drzava ? `${drzava} > ${g.opis}` : g.opis,
          typeLabel: 'Grad'
        })
      })
      
      // Opštine
      ;(opstineRes.data || []).forEach(o => {
        const grad = o.grad?.opis || ''
        const drzava = o.grad?.drzava?.opis || ''
        const parts = [drzava, grad, o.opis].filter(Boolean)
        allLokaliteti.push({
          id: o.id,
          type: 'opstina',
          opis: o.opis,
          fullPath: parts.join(' > '),
          typeLabel: 'Opština'
        })
      })
      
      // Lokacije
      ;(lokacijeRes.data || []).forEach(l => {
        const opstina = l.opstina?.opis || ''
        const grad = l.opstina?.grad?.opis || ''
        const drzava = l.opstina?.grad?.drzava?.opis || ''
        const parts = [drzava, grad, opstina, l.opis].filter(Boolean)
        allLokaliteti.push({
          id: l.id,
          type: 'lokacija',
          opis: l.opis,
          fullPath: parts.join(' > '),
          typeLabel: 'Lokacija'
        })
      })
      
      // Ulice
      ;(uliceRes.data || []).forEach(u => {
        const lokacija = u.lokacija?.opis || ''
        const opstina = u.lokacija?.opstina?.opis || ''
        const grad = u.lokacija?.opstina?.grad?.opis || ''
        const drzava = u.lokacija?.opstina?.grad?.drzava?.opis || ''
        const parts = [drzava, grad, opstina, lokacija, u.opis].filter(Boolean)
        allLokaliteti.push({
          id: u.id,
          type: 'ulica',
          opis: u.opis,
          fullPath: parts.join(' > '),
          typeLabel: 'Ulica'
        })
      })
      
      setSviLokaliteti(allLokaliteti)
    } catch (error) {
      console.error('Greška pri učitavanju lokaliteta:', error)
    }
  }
  
  // Filtrirani lokaliteti za dropdown
  const filteredLokaliteti = useMemo(() => {
    if (!lokalitetSearch.trim()) return []
    const search = lokalitetSearch.toLowerCase()
    return sviLokaliteti
      .filter(l => l.fullPath.toLowerCase().includes(search))
      .filter(l => !selectedLokaliteti.some(s => s.id === l.id && s.type === l.type))
      .slice(0, 20)
  }, [lokalitetSearch, sviLokaliteti, selectedLokaliteti])
  
  const addLokalitet = (lokalitet) => {
    setSelectedLokaliteti(prev => [...prev, lokalitet])
    setLokalitetSearch('')
    setShowLokalitetDropdown(false)
  }
  
  const removeLokalitet = (lokalitet) => {
    setSelectedLokaliteti(prev => prev.filter(l => !(l.id === lokalitet.id && l.type === lokalitet.type)))
  }
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (lokalitetInputRef.current && !lokalitetInputRef.current.contains(e.target)) {
        setShowLokalitetDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadTraznje = async () => {
    try {
      console.log('📊 TraznjaModule: Početak učitavanja tražnji')
      setLoading(true)
      
      let query = supabase
        .from('traznja')
        .select(`
          id,
          datumkreiranja,
          datumpromene,
          datumbrisanja,
          kontaktosoba,
          kontakttelefon,
          strukturaod,
          strukturado,
          kvadraturaod,
          kvadraturado,
          cenaod,
          cenado,
          metapodaci,
          detaljitraznje,
          iddrzava,
          idgrada,
          idopstina,
          idlokacija,
          idulica,
          ai_karakteristike,
          stsaktivan,
          stskupaczakupac,
          spratod,
          spratdo,
          stsnecezadnjispratat,
          stsnecesuteren,
          statuskupca,
          iduser
        `)

      // Primeni filtere
      if (filters.stsaktivan !== null && filters.stsaktivan !== undefined && filters.stsaktivan !== '') {
        query = query.eq('stsaktivan', filters.stsaktivan)
      }
      if (filters.stskupaczakupac) {
        query = query.eq('stskupaczakupac', filters.stskupaczakupac)
      }
      if (filters.statuskupca) {
        query = query.eq('statuskupca', filters.statuskupca)
      }
      if (filters.cenaOd) {
        query = query.gte('cenaod', parseFloat(filters.cenaOd))
      }
      if (filters.cenaDo) {
        query = query.lte('cenado', parseFloat(filters.cenaDo))
      }
      if (filters.kvadraturaOd) {
        query = query.gte('kvadraturaod', parseFloat(filters.kvadraturaOd))
      }
      if (filters.kvadraturaDo) {
        query = query.lte('kvadraturado', parseFloat(filters.kvadraturaDo))
      }
      if (filters.strukturaOd) {
        query = query.gte('strukturaod', parseFloat(filters.strukturaOd))
      }
      if (filters.strukturaDo) {
        query = query.lte('strukturado', parseFloat(filters.strukturaDo))
      }
      
      // Lokalitet filteri
      const drzaveIds = selectedLokaliteti.filter(l => l.type === 'drzava').map(l => l.id)
      const gradoviIds = selectedLokaliteti.filter(l => l.type === 'grad').map(l => l.id)
      const opstineIds = selectedLokaliteti.filter(l => l.type === 'opstina').map(l => l.id)
      const lokacijeIds = selectedLokaliteti.filter(l => l.type === 'lokacija').map(l => l.id)
      const uliceIds = selectedLokaliteti.filter(l => l.type === 'ulica').map(l => l.id)
      
      if (drzaveIds.length > 0) {
        query = query.in('iddrzava', drzaveIds)
      }
      if (gradoviIds.length > 0) {
        query = query.in('idgrada', gradoviIds)
      }
      if (opstineIds.length > 0) {
        query = query.in('idopstina', opstineIds)
      }
      if (lokacijeIds.length > 0) {
        query = query.in('idlokacija', lokacijeIds)
      }
      if (uliceIds.length > 0) {
        query = query.in('idulica', uliceIds)
      }

      const { data, error } = await query.order('id', { ascending: false })

      if (error) throw error

      // Učitaj relacije
      const opstinaIds = [...new Set((data || []).map(t => t.idopstina).filter(Boolean))]
      const lokacijaIds = [...new Set((data || []).map(t => t.idlokacija).filter(Boolean))]
      const userIds = [...new Set((data || []).map(t => t.iduser).filter(Boolean))]

      const [opstineResult, lokacijeResult, korisniciResult] = await Promise.all([
        opstinaIds.length > 0 ? supabase.from('opstina').select('id, opis').in('id', opstinaIds) : Promise.resolve({ data: [] }),
        lokacijaIds.length > 0 ? supabase.from('lokacija').select('id, opis').in('id', lokacijaIds) : Promise.resolve({ data: [] }),
        userIds.length > 0 ? supabase.from('korisnici').select('id, naziv, email').in('id', userIds) : Promise.resolve({ data: [] })
      ])

      const opstineMap = new Map((opstineResult.data || []).map(o => [o.id, o]))
      const lokacijeMap = new Map((lokacijeResult.data || []).map(l => [l.id, l]))
      const korisniciMap = new Map((korisniciResult.data || []).map(k => [k.id, k]))

      const traznjeSaRelacijama = (data || []).map(traznja => ({
        ...traznja,
        opstina: traznja.idopstina ? opstineMap.get(traznja.idopstina) || null : null,
        lokacija: traznja.idlokacija ? lokacijeMap.get(traznja.idlokacija) || null : null,
        korisnik: traznja.iduser ? korisniciMap.get(traznja.iduser) || null : null
      }))

      setTraznje(traznjeSaRelacijama)
    } catch (error) {
      console.error('Greška pri učitavanju tražnji:', error)
      alert('Greška pri učitavanju tražnji: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadTraznje()
    setShowFilters(false)
  }

  const resetFilters = () => {
    setFilters({
      cenaOd: '',
      cenaDo: '',
      kvadraturaOd: '',
      kvadraturaDo: '',
      strukturaOd: '',
      strukturaDo: '',
      stsaktivan: true,
      stskupaczakupac: '',
      statuskupca: ''
    })
    setSelectedLokaliteti([])
  }

  const activeFiltersCount = [
    filters.cenaOd,
    filters.cenaDo,
    filters.kvadraturaOd,
    filters.kvadraturaDo,
    filters.strukturaOd,
    filters.strukturaDo,
    filters.stskupaczakupac,
    filters.statuskupca,
    ...selectedLokaliteti
  ].filter(Boolean).length

  const formatCena = (cena) => {
    if (!cena) return '-'
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(cena)
  }

  const formatDatum = (datum) => {
    if (!datum) return '-'
    return new Date(datum).toLocaleDateString('sr-RS')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Učitavanje tražnji...</p>
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
  const getFilteredAndSortedTraznje = () => {
    let result = [...traznje]

    // Filtriranje po kolonama
    if (columnFilters.id) {
      result = result.filter(t => String(t.id).includes(columnFilters.id))
    }
    if (columnFilters.kontaktosoba) {
      result = result.filter(t => 
        t.kontaktosoba?.toLowerCase().includes(columnFilters.kontaktosoba.toLowerCase())
      )
    }
    if (columnFilters.opstina) {
      result = result.filter(t => 
        t.opstina?.opis?.toLowerCase().includes(columnFilters.opstina.toLowerCase())
      )
    }
    if (columnFilters.lokacija) {
      result = result.filter(t => 
        t.lokacija?.opis?.toLowerCase().includes(columnFilters.lokacija.toLowerCase())
      )
    }
    if (columnFilters.cenado) {
      const maxCena = parseFloat(columnFilters.cenado)
      if (!isNaN(maxCena)) {
        result = result.filter(t => t.cenado <= maxCena)
      }
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
          case 'kontaktosoba':
            aVal = a.kontaktosoba || ''
            bVal = b.kontaktosoba || ''
            break
          case 'opstina':
            aVal = a.opstina?.opis || ''
            bVal = b.opstina?.opis || ''
            break
          case 'lokacija':
            aVal = a.lokacija?.opis || ''
            bVal = b.lokacija?.opis || ''
            break
          case 'cenado':
            aVal = a.cenado || 0
            bVal = b.cenado || 0
            break
          case 'datumkreiranja':
            aVal = new Date(a.datumkreiranja || 0).getTime()
            bVal = new Date(b.datumkreiranja || 0).getTime()
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
  
  const filteredAndSortedTraznje = getFilteredAndSortedTraznje()

  const totalTraznje = filteredAndSortedTraznje.length
  const totalPages = Math.ceil(totalTraznje / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTraznje = filteredAndSortedTraznje.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleAddTraznja = () => {
    setEditingTraznja(null)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingTraznja(null)
    loadTraznje()
  }

  // Arhiviraj tražnju (postavi stsaktivan na false)
  const handleArhiviraj = async (traznjaId) => {
    if (!confirm('Da li želite da arhivirate ovu tražnju?')) return
    
    try {
      const { error } = await supabase
        .from('traznja')
        .update({ 
          stsaktivan: false,
          datumbrisanja: new Date().toISOString()
        })
        .eq('id', traznjaId)

      if (error) throw error
      
      loadTraznje()
      setOpenActionMenu(null)
    } catch (error) {
      console.error('Greška pri arhiviranju:', error)
      alert('Greška pri arhiviranju tražnje: ' + error.message)
    }
  }

  // Dearhiviraj tražnju (postavi stsaktivan na true)
  const handleDearhiviraj = async (traznjaId) => {
    if (!confirm('Da li želite da dearhivirate ovu tražnju?')) return
    
    try {
      const { error } = await supabase
        .from('traznja')
        .update({ 
          stsaktivan: true,
          datumbrisanja: null
        })
        .eq('id', traznjaId)

      if (error) throw error
      
      loadTraznje()
      setOpenActionMenu(null)
    } catch (error) {
      console.error('Greška pri dearhiviranju:', error)
      alert('Greška pri dearhiviranju tražnje: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Tražnja</h2>
          <p className="text-gray-500 text-sm mt-1">Upravljanje tražnjama nekretnina</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleAddTraznja}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Dodaj tražnju</span>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Pretraga tražnji</h3>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tip: Kupac/Zakupac */}
              <div className="flex gap-2">
                {[
                  { value: '', label: 'Svi' },
                  { value: 'kupac', label: '🏠 Kupac' },
                  { value: 'zakupac', label: '🔑 Zakupac' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('stskupaczakupac', option.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      filters.stskupaczakupac === option.value
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Status: Aktivna/Neaktivna */}
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
                  Aktivne
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
                  Neaktivne
                </button>
              </div>

              {/* Status kupca */}
              <div className="flex gap-2">
                {[
                  { value: '', label: 'Svi' },
                  { value: 'vruc', emoji: '🔥', label: 'Vruci', color: 'from-red-400 to-orange-400', borderColor: 'border-red-300' },
                  { value: 'mlak', emoji: '🟡', label: 'Mlaki', color: 'from-yellow-400 to-amber-400', borderColor: 'border-yellow-300' },
                  { value: 'hladan', emoji: '❄️', label: 'Hladni', color: 'from-blue-400 to-cyan-400', borderColor: 'border-blue-300' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('statuskupca', option.value)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                      filters.statuskupca === option.value
                        ? option.value === ''
                          ? 'bg-gray-500 text-white'
                          : `bg-gradient-to-r ${option.color} text-white`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.emoji && <span className="text-lg">{option.emoji}</span>}
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Lokalitet - Autocomplete */}
              <div ref={lokalitetInputRef} className="relative">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={lokalitetSearch}
                    onChange={(e) => {
                      setLokalitetSearch(e.target.value)
                      setShowLokalitetDropdown(true)
                    }}
                    onFocus={() => setShowLokalitetDropdown(true)}
                    placeholder="Unesite lokaciju (država, grad, opština, lokacija, ulica)"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                
                {/* Dropdown sa rezultatima */}
                {showLokalitetDropdown && filteredLokaliteti.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                    {filteredLokaliteti.map(lok => {
                      const search = lokalitetSearch.toLowerCase()
                      const fullPath = lok.fullPath
                      const lowerPath = fullPath.toLowerCase()
                      const matchIndex = lowerPath.indexOf(search)
                      
                      let displayPath
                      if (matchIndex >= 0) {
                        const before = fullPath.slice(0, matchIndex)
                        const match = fullPath.slice(matchIndex, matchIndex + search.length)
                        const after = fullPath.slice(matchIndex + search.length)
                        displayPath = (
                          <>
                            <span className="text-gray-500">{before}</span>
                            <span className="text-amber-600 font-semibold bg-amber-50 px-0.5 rounded">{match}</span>
                            <span className="text-gray-700">{after}</span>
                          </>
                        )
                      } else {
                        displayPath = <span className="text-gray-700">{fullPath}</span>
                      }
                      
                      return (
                        <button
                          key={`${lok.type}-${lok.id}`}
                          onClick={() => addLokalitet(lok)}
                          className="w-full px-4 py-3 text-left hover:bg-amber-50 flex items-center justify-between border-b border-gray-100 last:border-0 group transition-colors"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="text-sm truncate">{displayPath}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                            lok.type === 'drzava' ? 'bg-blue-100 text-blue-700' :
                            lok.type === 'grad' ? 'bg-purple-100 text-purple-700' :
                            lok.type === 'opstina' ? 'bg-emerald-100 text-emerald-700' :
                            lok.type === 'lokacija' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {lok.typeLabel}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
                
                {/* Izabrani lokaliteti kao tagovi */}
                {selectedLokaliteti.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedLokaliteti.map(lok => (
                      <span
                        key={`${lok.type}-${lok.id}`}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                          lok.type === 'drzava' ? 'bg-blue-100 text-blue-800' :
                          lok.type === 'grad' ? 'bg-purple-100 text-purple-800' :
                          lok.type === 'opstina' ? 'bg-emerald-100 text-emerald-800' :
                          lok.type === 'lokacija' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span className="max-w-[200px] truncate" title={lok.fullPath}>
                          {lok.fullPath}
                        </span>
                        <button
                          onClick={() => removeLokalitet(lok)}
                          className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Cena */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={filters.cenaOd}
                    onChange={(e) => handleFilterChange('cenaOd', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Cena od"
                  />
                </div>
                <div className="relative">
                  <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={filters.cenaDo}
                    onChange={(e) => handleFilterChange('cenaDo', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Cena do"
                  />
                </div>
              </div>

              {/* Kvadratura */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={filters.kvadraturaOd}
                    onChange={(e) => handleFilterChange('kvadraturaOd', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Kvadratura od (m²)"
                  />
                </div>
                <div className="relative">
                  <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={filters.kvadraturaDo}
                    onChange={(e) => handleFilterChange('kvadraturaDo', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Kvadratura do (m²)"
                  />
                </div>
              </div>

              {/* Struktura */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.5"
                    value={filters.strukturaOd}
                    onChange={(e) => handleFilterChange('strukturaOd', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Broj soba od"
                  />
                </div>
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.5"
                    value={filters.strukturaDo}
                    onChange={(e) => handleFilterChange('strukturaDo', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Broj soba do"
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
                {loading ? 'Pretražujem...' : 'Prikaži tražnje'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {traznje.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-2xl font-bold mb-2">Nema tražnji</p>
          <p className="text-gray-500">Nema tražnji koje odgovaraju vašim kriterijumima.</p>
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
                    onClick={() => handleSort('kontaktosoba')}
                  >
                    <div className="flex items-center gap-1">
                      Kontakt
                      {sortConfig.key === 'kontaktosoba' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('opstina')}
                  >
                    <div className="flex items-center gap-1">
                      Opština
                      {sortConfig.key === 'opstina' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('lokacija')}
                  >
                    <div className="flex items-center gap-1">
                      Lokacija
                      {sortConfig.key === 'lokacija' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('cenado')}
                  >
                    <div className="flex items-center gap-1">
                      Cena do
                      {sortConfig.key === 'cenado' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">m² od-do</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Sprat</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status kupca</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tip</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
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
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Ugovor</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Agent</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider w-10"></th>
                </tr>
                {/* Red sa filterima */}
                <tr className="bg-gray-800">
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.id}
                      onChange={(e) => handleColumnFilterChange('id', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.kontaktosoba}
                      onChange={(e) => handleColumnFilterChange('kontaktosoba', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.opstina}
                      onChange={(e) => handleColumnFilterChange('opstina', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="text"
                      value={columnFilters.lokacija}
                      onChange={(e) => handleColumnFilterChange('lokacija', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="number"
                      value={columnFilters.cenado}
                      onChange={(e) => handleColumnFilterChange('cenado', e.target.value)}
                      placeholder="≤"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedTraznje.map((traznja, index) => (
                  <tr 
                    key={traznja.id} 
                    className={`
                      hover:bg-amber-50 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-amber-500
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    `}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center min-w-[40px] h-7 bg-gradient-to-r from-gray-900 to-black text-white text-xs font-bold rounded-lg px-2">
                        {traznja.id}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                          <Phone className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900 block">{traznja.kontaktosoba || '-'}</span>
                          <span className="text-xs text-gray-500">{traznja.kontakttelefon || ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{traznja.opstina?.opis || '-'}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-gray-700">{traznja.lokacija?.opis || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Euro className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-bold text-gray-900">{traznja.cenado ? new Intl.NumberFormat('sr-RS').format(traznja.cenado) : '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {traznja.kvadraturaod || '?'} - {traznja.kvadraturado || '?'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-gray-700">
                          {traznja.spratod || '?'} - {traznja.spratdo || '?'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {traznja.statuskupca ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white ${
                          traznja.statuskupca === 'vruc'
                            ? 'bg-gradient-to-r from-red-400 to-orange-400'
                            : traznja.statuskupca === 'mlak'
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-400'
                            : traznja.statuskupca === 'hladan'
                            ? 'bg-gradient-to-r from-blue-400 to-cyan-400'
                            : 'bg-gray-300'
                        }`}>
                          {traznja.statuskupca === 'vruc' ? '🔥 Vruci' : traznja.statuskupca === 'mlak' ? '🟡 Mlaki' : traznja.statuskupca === 'hladan' ? '❄️ Hladni' : '-'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                        traznja.stskupaczakupac === 'kupac'
                          ? 'bg-blue-100 text-blue-800'
                          : traznja.stskupaczakupac === 'zakupac'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {traznja.stskupaczakupac === 'kupac' ? '🏠 Kupac' : traznja.stskupaczakupac === 'zakupac' ? '🔑 Zakupac' : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
                          traznja.stsaktivan
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${traznja.stsaktivan ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                          {traznja.stsaktivan ? 'Aktivna' : 'Neaktivna'}
                        </span>
                        {/* Prikaz datuma brisanja za neaktivne */}
                        {!traznja.stsaktivan && traznja.datumbrisanja && (
                          <div className="text-xs text-gray-500 mt-1">
                            <div>{formatDatum(traznja.datumbrisanja)}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDatum(traznja.datumkreiranja)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {traznja.metapodaci?.eop?.stsugovorpotpisan ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                          <span className="text-emerald-600 text-lg">✓</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                          <span className="text-gray-400 text-lg">−</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {traznja.korisnik ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-purple-700" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{traznja.korisnik.naziv}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenActionMenu(openActionMenu === traznja.id ? null : traznja.id)
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {/* Dropdown meni - prikaži iznad za poslednja 2 reda */}
                        {openActionMenu === traznja.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setOpenActionMenu(null)}
                            />
                            <div className={`absolute right-0 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 ${
                              index >= paginatedTraznje.length - 2 
                                ? 'bottom-full mb-2' 
                                : 'top-full mt-2'
                            }`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingTraznja(traznja)
                                  setShowForm(true)
                                  setOpenActionMenu(null)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                                Promeni
                              </button>
                              {traznja.stsaktivan ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleArhiviraj(traznja.id)
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
                                    handleDearhiviraj(traznja.id)
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
              Ukupno: <span className="text-amber-400 font-bold">{totalTraznje}</span> tražnji
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <TraznjaForm
          traznja={editingTraznja}
          onClose={() => {
            setShowForm(false)
            setEditingTraznja(null)
          }}
          onSuccess={handleFormSuccess}
        />
      )}

    </div>
  )
}
