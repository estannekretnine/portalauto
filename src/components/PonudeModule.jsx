import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { Search, X, Grid, List, Image as ImageIcon, MapPin, Home, Ruler, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter, RotateCcw, Building2, Euro, Pencil, Archive, XCircle, MoreVertical } from 'lucide-react'
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
  const [editingPonuda, setEditingPonuda] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [openActionMenu, setOpenActionMenu] = useState(null) // ID ponude za koju je otvoren meni
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Sortiranje i pretraga po kolonama
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    vrsta: '',
    opstina: '',
    lokacija: '',
    ulica: '',
    kvadratura: '',
    struktura: '',
    cena: ''
  })
  
  // Lokalitet podaci - sve u jednoj listi za autocomplete
  const [sviLokaliteti, setSviLokaliteti] = useState([])
  const [lokalitetSearch, setLokalitetSearch] = useState('')
  const [showLokalitetDropdown, setShowLokalitetDropdown] = useState(false)
  const [selectedLokaliteti, setSelectedLokaliteti] = useState([]) // { id, type, opis }
  const lokalitetInputRef = useRef(null)
  
  const [filters, setFilters] = useState({
    idvrstaobjekta: '',
    kvadraturaOd: '',
    kvadraturaDo: '',
    strukturaOd: '',
    strukturaDo: '',
    cenaOd: '',
    cenaDo: '',
    stsaktivan: true,
    stsrentaprodaja: 'prodaja'
  })

  useEffect(() => {
    loadVrsteObjekata()
    loadLokalitetData()
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

  const loadLokalitetData = async () => {
    try {
      // Učitaj sve lokalitet podatke sa relacijama
      const [drzaveRes, gradoviRes, opstineRes, lokacijeRes, uliceRes] = await Promise.all([
        supabase.from('drzava').select('*').order('opis'),
        supabase.from('grad').select('*, drzava:iddrzava(id, opis)').order('opis'),
        supabase.from('opstina').select('*, grad:idgrada(id, opis, drzava:iddrzava(id, opis))').order('opis'),
        supabase.from('lokacija').select('*, opstina:idopstina(id, opis, grad:idgrada(id, opis, drzava:iddrzava(id, opis)))').order('opis'),
        supabase.from('ulica').select('*, lokacija:idlokacija(id, opis, opstina:idopstina(id, opis, grad:idgrada(id, opis, drzava:iddrzava(id, opis))))').order('opis')
      ])
      
      setLokacije(lokacijeRes.data || [])
      
      // Kreiraj listu sa kompletnim putanjama
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
      
      // Gradovi: Država > Grad
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
      
      // Opštine: Država > Grad > Opština
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
      
      // Lokacije: Država > Grad > Opština > Lokacija
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
      
      // Ulice: Država > Grad > Opština > Lokacija > Ulica
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
  
  // Filtrirani lokaliteti za dropdown - pretražuje po celoj putanji
  const filteredLokaliteti = useMemo(() => {
    if (!lokalitetSearch.trim()) return []
    const search = lokalitetSearch.toLowerCase()
    return sviLokaliteti
      .filter(l => l.fullPath.toLowerCase().includes(search))
      .filter(l => !selectedLokaliteti.some(s => s.id === l.id && s.type === l.type))
      .slice(0, 20)
  }, [lokalitetSearch, sviLokaliteti, selectedLokaliteti])
  
  // Dodaj lokalitet
  const addLokalitet = (lokalitet) => {
    setSelectedLokaliteti(prev => [...prev, lokalitet])
    setLokalitetSearch('')
    setShowLokalitetDropdown(false)
  }
  
  // Ukloni lokalitet
  const removeLokalitet = (lokalitet) => {
    setSelectedLokaliteti(prev => prev.filter(l => !(l.id === lokalitet.id && l.type === lokalitet.type)))
  }
  
  // Zatvori dropdown kad se klikne van
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (lokalitetInputRef.current && !lokalitetInputRef.current.contains(e.target)) {
        setShowLokalitetDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          stsrentaprodaja,
          vidljivostnasajtu,
          metapodaci
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
      
      // Lokalitet filteri iz selectedLokaliteti
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Pretraga - poziva se na klik dugmeta
  const handleSearch = () => {
    setCurrentPage(1)
    loadPonude()
    setShowFilters(false)
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
      stsaktivan: true,
      stsrentaprodaja: 'prodaja'
    })
    setSelectedLokaliteti([])
  }

  // Broj aktivnih filtera
  const activeFiltersCount = [
    filters.idvrstaobjekta,
    filters.cenaOd,
    filters.cenaDo,
    filters.kvadraturaOd,
    filters.kvadraturaDo,
    filters.strukturaOd,
    filters.strukturaDo,
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

  // Funkcija za sortiranje
  const handleSort = (key) => {
    let newDirection = 'asc'
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') newDirection = 'desc'
      else if (sortConfig.direction === 'desc') newDirection = null
    }
    setSortConfig({ key: newDirection ? key : null, direction: newDirection })
  }

  // Funkcija za promenu filtera kolone
  const handleColumnFilterChange = (key, value) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }))
  }

  // Filtrirani i sortirani podaci - računaju se pri svakom renderovanju
  const getFilteredAndSortedPonude = () => {
    let result = [...ponude]

    // Filtriranje po kolonama
    if (columnFilters.id) {
      result = result.filter(p => String(p.id).includes(columnFilters.id))
    }
    if (columnFilters.vrsta) {
      result = result.filter(p => 
        p.vrstaobjekta?.opis?.toLowerCase().includes(columnFilters.vrsta.toLowerCase())
      )
    }
    if (columnFilters.opstina) {
      result = result.filter(p => 
        p.opstina?.opis?.toLowerCase().includes(columnFilters.opstina.toLowerCase())
      )
    }
    if (columnFilters.lokacija) {
      result = result.filter(p => 
        p.lokacija?.opis?.toLowerCase().includes(columnFilters.lokacija.toLowerCase())
      )
    }
    if (columnFilters.ulica) {
      result = result.filter(p => 
        p.ulica?.opis?.toLowerCase().includes(columnFilters.ulica.toLowerCase())
      )
    }
    if (columnFilters.kvadratura) {
      const minKvad = parseFloat(columnFilters.kvadratura)
      if (!isNaN(minKvad)) {
        result = result.filter(p => p.kvadratura >= minKvad)
      }
    }
    if (columnFilters.struktura) {
      const minStr = parseFloat(columnFilters.struktura)
      if (!isNaN(minStr)) {
        result = result.filter(p => p.struktura >= minStr)
      }
    }
    if (columnFilters.cena) {
      const minCena = parseFloat(columnFilters.cena)
      if (!isNaN(minCena)) {
        result = result.filter(p => p.cena >= minCena)
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
          case 'vrsta':
            aVal = a.vrstaobjekta?.opis || ''
            bVal = b.vrstaobjekta?.opis || ''
            break
          case 'opstina':
            aVal = a.opstina?.opis || ''
            bVal = b.opstina?.opis || ''
            break
          case 'lokacija':
            aVal = a.lokacija?.opis || ''
            bVal = b.lokacija?.opis || ''
            break
          case 'ulica':
            aVal = a.ulica?.opis || ''
            bVal = b.ulica?.opis || ''
            break
          case 'kvadratura':
            aVal = a.kvadratura || 0
            bVal = b.kvadratura || 0
            break
          case 'struktura':
            aVal = parseFloat(a.struktura) || 0
            bVal = parseFloat(b.struktura) || 0
            break
          case 'cena':
            aVal = a.cena || 0
            bVal = b.cena || 0
            break
          default:
            return 0
        }

        // String comparison
        if (typeof aVal === 'string') {
          const comparison = aVal.localeCompare(bVal, 'sr')
          return sortConfig.direction === 'asc' ? comparison : -comparison
        }

        // Number comparison
        if (sortConfig.direction === 'asc') {
          return aVal - bVal
        }
        return bVal - aVal
      })
    }

    return result
  }
  
  const filteredAndSortedPonude = getFilteredAndSortedPonude()

  const totalPonude = filteredAndSortedPonude.length
  const totalPages = Math.ceil(totalPonude / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPonude = filteredAndSortedPonude.slice(startIndex, endIndex)

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

  // Arhiviraj ponudu (postavi stsaktivan na false)
  const handleArhiviraj = async (ponudaId) => {
    try {
      const { error } = await supabase
        .from('ponuda')
        .update({ stsaktivan: false })
        .eq('id', ponudaId)

      if (error) throw error
      
      loadPonude()
      setOpenActionMenu(null)
    } catch (error) {
      console.error('Greška pri arhiviranju:', error)
      alert('Greška pri arhiviranju ponude: ' + error.message)
    }
  }

  // Storniraj ponudu (za sada samo placeholder - možeš prilagoditi logiku)
  const handleStorniraj = async (ponudaId) => {
    if (!confirm('Da li ste sigurni da želite da stornirate ovu ponudu?')) return
    
    try {
      // Ovde možeš dodati svoju logiku za storniranje
      // Na primer, brisanje ili postavljanje posebnog statusa
      const { error } = await supabase
        .from('ponuda')
        .delete()
        .eq('id', ponudaId)

      if (error) throw error
      
      loadPonude()
      setOpenActionMenu(null)
    } catch (error) {
      console.error('Greška pri storniranju:', error)
      alert('Greška pri storniranju ponude: ' + error.message)
    }
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

      {/* Filter Modal - Popup */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Pretraga ponuda</h3>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Red 1: Tip transakcije */}
              <div className="flex gap-2">
                {[
                  { value: '', label: 'Sve' },
                  { value: 'prodaja', label: 'Prodaja' },
                  { value: 'renta', label: 'Izdavanje' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('stsrentaprodaja', option.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      filters.stsrentaprodaja === option.value
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Red 2: Vrsta objekta */}
              <div className="relative">
                <select
                  value={filters.idvrstaobjekta}
                  onChange={(e) => handleFilterChange('idvrstaobjekta', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">Tip nekretnine</option>
                  {vrsteObjekata.map(vrsta => (
                    <option key={vrsta.id} value={vrsta.id}>{vrsta.opis}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Red 3: Lokalitet - Autocomplete kao HaloOglasi */}
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
                
                {/* Dropdown sa rezultatima - prikazuje kompletnu putanju */}
                {showLokalitetDropdown && filteredLokaliteti.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                    {filteredLokaliteti.map(lok => {
                      // Highlight-uj deo koji se poklapa sa pretragom
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
                
                {/* Izabrani lokaliteti kao tagovi - prikazuje punu putanju */}
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

              {/* Red 4: Cena */}
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

              {/* Red 5: Kvadratura */}
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

              {/* Red 6: Struktura */}
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

              {/* Red 7: Status */}
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
                {loading ? 'Pretražujem...' : 'Prikaži oglase'}
              </button>
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
                    onClick={() => handleSort('vrsta')}
                  >
                    <div className="flex items-center gap-1">
                      Vrsta
                      {sortConfig.key === 'vrsta' && (
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
                    onClick={() => handleSort('ulica')}
                  >
                    <div className="flex items-center gap-1">
                      Ulica
                      {sortConfig.key === 'ulica' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('kvadratura')}
                    title="Kvadratura nekretnine"
                  >
                    <div className="flex items-center gap-1">
                      m²
                      {sortConfig.key === 'kvadratura' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('struktura')}
                  >
                    <div className="flex items-center gap-1">
                      STR
                      {sortConfig.key === 'struktura' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none"
                    onClick={() => handleSort('cena')}
                  >
                    <div className="flex items-center gap-1">
                      Cena
                      {sortConfig.key === 'cena' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" title="Vidljivo na sajtu">Vid</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider" title="Ugovor potpisan">Ug</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tip</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Akcije</th>
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
                      value={columnFilters.vrsta}
                      onChange={(e) => handleColumnFilterChange('vrsta', e.target.value)}
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
                      type="text"
                      value={columnFilters.ulica}
                      onChange={(e) => handleColumnFilterChange('ulica', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="number"
                      value={columnFilters.kvadratura}
                      onChange={(e) => handleColumnFilterChange('kvadratura', e.target.value)}
                      placeholder="≥"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="number"
                      step="0.5"
                      value={columnFilters.struktura}
                      onChange={(e) => handleColumnFilterChange('struktura', e.target.value)}
                      placeholder="≥"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-2 py-2">
                    <input
                      type="number"
                      value={columnFilters.cena}
                      onChange={(e) => handleColumnFilterChange('cena', e.target.value)}
                      placeholder="≥"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
                  <th className="px-2 py-2"></th>
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center min-w-[40px] h-7 bg-gradient-to-r from-gray-900 to-black text-white text-xs font-bold rounded-lg px-2">
                        {ponuda.id}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-amber-700" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{ponuda.vrstaobjekta?.opis || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{ponuda.opstina?.opis || '-'}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-gray-700">{ponuda.lokacija?.opis || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{ponuda.ulica?.opis || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-900">{ponuda.kvadratura ? `${ponuda.kvadratura}` : '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700">
                        {ponuda.struktura ? parseFloat(ponuda.struktura).toFixed(1) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Euro className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-bold text-gray-900">{ponuda.cena ? new Intl.NumberFormat('sr-RS').format(ponuda.cena) : '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        ponuda.vidljivostnasajtu
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {ponuda.vidljivostnasajtu ? '👁️' : '🚫'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        ponuda.metapodaci?.eop?.sts_ugovor_potpisan
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {ponuda.metapodaci?.eop?.sts_ugovor_potpisan ? '📝' : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
                        ponuda.stsaktivan
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${ponuda.stsaktivan ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        {ponuda.stsaktivan ? 'Aktivan' : 'Neaktivan'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                        ponuda.stsrentaprodaja === 'prodaja'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ponuda.stsrentaprodaja === 'prodaja' ? '🏠 Prodaja' : '🔑 Renta'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenActionMenu(openActionMenu === ponuda.id ? null : ponuda.id)
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {/* Dropdown meni */}
                        {openActionMenu === ponuda.id && (
                          <>
                            {/* Invisible overlay to close menu */}
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setOpenActionMenu(null)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingPonuda(ponuda)
                                  setShowForm(true)
                                  setOpenActionMenu(null)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                                Promeni
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleArhiviraj(ponuda.id)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                              >
                                <Archive className="w-4 h-4" />
                                Arhiviraj
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStorniraj(ponuda.id)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                Storniraj
                              </button>
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
