import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Map, Plus, Search, Edit2, Trash2, X, Save, Loader2, Calendar, User, MessageSquare, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArchiveRestore, Filter, RotateCcw, MoreVertical, Archive, Home, FileSearch, Pencil } from 'lucide-react'

export default function TereniModule() {
  const [tereni, setTereni] = useState([])
  const [ponude, setPonude] = useState([])
  const [traznje, setTraznje] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTeren, setEditingTeren] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [openActionMenu, setOpenActionMenu] = useState(null)
  
  // Sortiranje i pretraga po kolonama
  const [sortConfig, setSortConfig] = useState({ key: 'datumkreiranja', direction: 'desc' })
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    kupac: '',
    prodavac: '',
    komentar: ''
  })
  
  const [filters, setFilters] = useState({
    stsaktivan: true,
    dateFrom: '',
    dateTo: ''
  })

  // Forma state
  const [formData, setFormData] = useState({
    idponude: '',
    idtraznja: '',
    komentar: '',
    utisakkupca: 5,
    glavnezamerke: '',
    glavnepohvale: '',
    spremnostnacenu: false,
    spremnostnacenuopis: '',
    nacinplacanja: '',
    arhiviran: false,
    detaljitraznje: {
      neverbalna_komunikacija: '',
      deal_breaker_faktori: '',
      poredjenje_sa_prethodnim: '',
      hitnost_useljenja: '',
      emocionalna_reakcija: '',
      dodatne_napomene: ''
    }
  })

  // Učitaj podatke
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('tereni')
        .select(`
          *,
          ponuda:idponude(id, cena, kvadratura, stsrentaprodaja, metapodaci, vrstaobjekta:idvrstaobjekta(opis), opstina:idopstina(opis)),
          traznja:idtraznja(id, kontaktosoba, stskupaczakupac, metapodaci),
          korisnik:iduser(id, naziv, email)
        `)

      // Primeni filtere
      if (filters.stsaktivan !== null && filters.stsaktivan !== undefined && filters.stsaktivan !== '') {
        if (filters.stsaktivan === true) {
          query = query.or('arhiviran.is.null,arhiviran.eq.false')
        } else {
          query = query.eq('arhiviran', true)
        }
      }
      if (filters.dateFrom) {
        query = query.gte('datumkreiranja', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('datumkreiranja', filters.dateTo + 'T23:59:59')
      }

      const { data: tereniData, error: tereniError } = await query.order('datumkreiranja', { ascending: false })

      if (tereniError) throw tereniError
      setTereni(tereniData || [])

      // Učitaj ponude za dropdown
      const { data: ponudeData } = await supabase
        .from('ponuda')
        .select('id, cena, kvadratura, stsrentaprodaja, metapodaci, vrstaobjekta:idvrstaobjekta(opis), opstina:idopstina(opis)')
        .eq('stsaktivan', true)
        .order('id', { ascending: false })
      setPonude(ponudeData || [])

      // Učitaj tražnje za dropdown
      const { data: traznjeData } = await supabase
        .from('traznja')
        .select('id, kontaktosoba, stskupaczakupac, metapodaci')
        .eq('stsaktivan', true)
        .order('id', { ascending: false })
      setTraznje(traznjeData || [])

    } catch (error) {
      console.error('Greška pri učitavanju:', error)
      alert('Greška pri učitavanju podataka')
    } finally {
      setLoading(false)
    }
  }

  // Dobij ime prodavca iz ponude
  const getProdavacIme = (ponuda) => {
    if (!ponuda) return '-'
    const vlasnici = ponuda.metapodaci?.vlasnici || []
    if (vlasnici.length > 0 && (vlasnici[0].ime || vlasnici[0].prezime)) {
      return `${vlasnici[0].ime || ''} ${vlasnici[0].prezime || ''}`.trim()
    }
    return `Ponuda #${ponuda.id}`
  }

  // Dobij ime kupca iz tražnje
  const getKupacIme = (traznja) => {
    if (!traznja) return '-'
    if (traznja.kontaktosoba) return traznja.kontaktosoba
    const nalogodavci = traznja.metapodaci?.nalogodavci || []
    if (nalogodavci.length > 0 && (nalogodavci[0].ime || nalogodavci[0].prezime)) {
      return `${nalogodavci[0].ime || ''} ${nalogodavci[0].prezime || ''}`.trim()
    }
    return `Tražnja #${traznja.id}`
  }

  // Format datuma
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDatumVreme = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Otvori formu za novi teren
  const handleAdd = () => {
    setEditingTeren(null)
    setFormData({
      idponude: '',
      idtraznja: '',
      komentar: '',
      utisakkupca: 5,
      glavnezamerke: '',
      glavnepohvale: '',
      spremnostnacenu: false,
      spremnostnacenuopis: '',
      nacinplacanja: '',
      arhiviran: false,
      detaljitraznje: {
        neverbalna_komunikacija: '',
        deal_breaker_faktori: '',
        poredjenje_sa_prethodnim: '',
        hitnost_useljenja: '',
        emocionalna_reakcija: '',
        dodatne_napomene: ''
      }
    })
    setShowForm(true)
  }

  // Otvori formu za izmenu
  const handleEdit = (teren) => {
    setEditingTeren(teren)
    setFormData({
      idponude: teren.idponude || '',
      idtraznja: teren.idtraznja || '',
      komentar: teren.komentar || '',
      utisakkupca: teren.utisakkupca || 5,
      glavnezamerke: teren.glavnezamerke || '',
      glavnepohvale: teren.glavnepohvale || '',
      spremnostnacenu: teren.spremnostnacenu || false,
      spremnostnacenuopis: teren.spremnostnacenuopis || '',
      nacinplacanja: teren.nacinplacanja || '',
      arhiviran: teren.arhiviran || false,
      detaljitraznje: teren.detaljitraznje || {
        neverbalna_komunikacija: '',
        deal_breaker_faktori: '',
        poredjenje_sa_prethodnim: '',
        hitnost_useljenja: '',
        emocionalna_reakcija: '',
        dodatne_napomene: ''
      }
    })
    setShowForm(true)
  }

  // Sačuvaj teren
  const handleSave = async () => {
    if (!formData.idponude && !formData.idtraznja) {
      alert('Morate izabrati ponudu ili tražnju')
      return
    }

    setSaving(true)
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      
      const dataToSave = {
        idponude: formData.idponude || null,
        idtraznja: formData.idtraznja || null,
        komentar: formData.komentar,
        utisakkupca: formData.utisakkupca,
        glavnezamerke: formData.glavnezamerke,
        glavnepohvale: formData.glavnepohvale,
        spremnostnacenu: formData.spremnostnacenu,
        spremnostnacenuopis: formData.spremnostnacenuopis,
        nacinplacanja: formData.nacinplacanja,
        arhiviran: formData.arhiviran,
        detaljitraznje: formData.detaljitraznje,
        iduser: currentUser?.id || null
      }

      if (editingTeren) {
        // Update
        const { error } = await supabase
          .from('tereni')
          .update({
            ...dataToSave,
            datumpromene: new Date().toISOString()
          })
          .eq('id', editingTeren.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('tereni')
          .insert({
            ...dataToSave,
            datumkreiranja: new Date().toISOString()
          })

        if (error) throw error
      }

      setShowForm(false)
      fetchData()
    } catch (error) {
      console.error('Greška pri čuvanju:', error)
      alert('Greška pri čuvanju: ' + error.message)
    } finally {
      setSaving(false)
    }
  }


  // Vrati teren u aktuelne (dearhiviraj)
  const handleDearhiviraj = async (id) => {
    if (!confirm('Da li želite da vratite ovaj teren u aktuelne?')) return

    try {
      const { error } = await supabase
        .from('tereni')
        .update({ 
          arhiviran: false,
          datumpromene: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      fetchData()
      setOpenActionMenu(null)
    } catch (error) {
      console.error('Greška pri vraćanju terena:', error)
      alert('Greška pri vraćanju terena: ' + error.message)
    }
  }

  // Handler za promenu detalja tražnje
  const handleDetaljiChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      detaljitraznje: {
        ...prev.detaljitraznje,
        [field]: value
      }
    }))
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchData()
    setShowFilters(false)
  }

  const resetFilters = () => {
    setFilters({
      stsaktivan: true,
      dateFrom: '',
      dateTo: ''
    })
  }

  const activeFiltersCount = [
    filters.dateFrom,
    filters.dateTo
  ].filter(Boolean).length

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
  const getFilteredAndSortedTereni = () => {
    let result = [...tereni]

    // Filtriranje po kolonama
    if (columnFilters.id) {
      result = result.filter(t => String(t.id).includes(columnFilters.id))
    }
    if (columnFilters.kupac) {
      result = result.filter(t => 
        getKupacIme(t.traznja).toLowerCase().includes(columnFilters.kupac.toLowerCase())
      )
    }
    if (columnFilters.prodavac) {
      result = result.filter(t => 
        getProdavacIme(t.ponuda).toLowerCase().includes(columnFilters.prodavac.toLowerCase())
      )
    }
    if (columnFilters.komentar) {
      result = result.filter(t => 
        (t.komentar || '').toLowerCase().includes(columnFilters.komentar.toLowerCase())
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
            aVal = getKupacIme(a.traznja)
            bVal = getKupacIme(b.traznja)
            break
          case 'prodavac':
            aVal = getProdavacIme(a.ponuda)
            bVal = getProdavacIme(b.ponuda)
            break
          case 'utisakkupca':
            aVal = a.utisakkupca || 0
            bVal = b.utisakkupca || 0
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
  
  const filteredAndSortedTereni = getFilteredAndSortedTereni()

  const totalTereni = filteredAndSortedTereni.length
  const totalPages = Math.ceil(totalTereni / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTereni = filteredAndSortedTereni.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleArhiviraj = async (terenId) => {
    if (!confirm('Da li želite da arhivirate ovaj teren?')) return
    
    try {
      const { error } = await supabase
        .from('tereni')
        .update({ 
          arhiviran: true,
          datumpromene: new Date().toISOString()
        })
        .eq('id', terenId)

      if (error) throw error
      
      fetchData()
      setOpenActionMenu(null)
    } catch (error) {
      console.error('Greška pri arhiviranju:', error)
      alert('Greška pri arhiviranju terena: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Učitavanje terena...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Tereni</h2>
          <p className="text-gray-500 text-sm mt-1">Evidencija obilazaka nekretnina</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Dodaj teren</span>
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
              <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
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
                <Search className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Pretraga terena</h3>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Datum do</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
                {loading ? 'Pretražujem...' : 'Prikaži terene'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {tereni.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Map className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-900 text-2xl font-bold mb-2">Nema terena</p>
          <p className="text-gray-500">Nema terena koji odgovaraju vašim kriterijumima.</p>
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
                    onClick={() => handleSort('utisakkupca')}
                  >
                    <div className="flex items-center gap-1">
                      Utisak
                      {sortConfig.key === 'utisakkupca' && (
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
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-2"></th>
                  <th className="px-4 py-2">
                    <input
                      type="text"
                      value={columnFilters.kupac}
                      onChange={(e) => handleColumnFilterChange('kupac', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-2">
                    <input
                      type="text"
                      value={columnFilters.prodavac}
                      onChange={(e) => handleColumnFilterChange('prodavac', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-2">
                    <input
                      type="text"
                      value={columnFilters.komentar}
                      onChange={(e) => handleColumnFilterChange('komentar', e.target.value)}
                      placeholder="🔍"
                      className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-2"></th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedTereni.map((teren, index) => (
                  <>
                    <tr 
                      key={teren.id} 
                      className={`
                        hover:bg-emerald-50 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-emerald-500
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        ${teren.arhiviran ? 'opacity-60' : ''}
                      `}
                      onClick={() => setExpandedRow(expandedRow === teren.id ? null : teren.id)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center min-w-[40px] h-7 bg-gradient-to-r from-gray-900 to-black text-white text-xs font-bold rounded-lg px-2">
                          {teren.id}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{formatDate(teren.datumkreiranja)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                            <FileSearch className="w-4 h-4 text-blue-700" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-900 block">
                              {getKupacIme(teren.traznja)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
                            <Home className="w-4 h-4 text-emerald-700" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-900 block">
                              {getProdavacIme(teren.ponuda)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2 max-w-xs">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 line-clamp-2">
                            {teren.komentar || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${star <= (teren.utisakkupca || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenActionMenu(openActionMenu === teren.id ? null : teren.id)
                            }}
                            className="inline-flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl transition-all"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {/* Dropdown meni */}
                          {openActionMenu === teren.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setOpenActionMenu(null)}
                              />
                              <div className={`absolute right-0 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 ${
                                index >= paginatedTereni.length - 2 
                                  ? 'bottom-full mb-2' 
                                  : 'top-full mt-2'
                              }`}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedRow(expandedRow === teren.id ? null : teren.id)
                                    setOpenActionMenu(null)
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                >
                                  {expandedRow === teren.id ? (
                                    <>
                                      <ChevronUp className="w-4 h-4" />
                                      Sakrij detalje
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4" />
                                      Prikaži detalje
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(teren)
                                    setOpenActionMenu(null)
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Promeni
                                </button>
                                {!teren.arhiviran ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleArhiviraj(teren.id)
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
                                      handleDearhiviraj(teren.id)
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
                    {/* Expanded row - detalji */}
                    {expandedRow === teren.id && (
                      <tr className="bg-emerald-50/50">
                        <td colSpan="7" className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Glavne pohvale</p>
                              <p className="text-sm text-gray-900">{teren.glavnepohvale || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Glavne zamerke</p>
                              <p className="text-sm text-gray-900">{teren.glavnezamerke || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Spremnost na cenu</p>
                              <p className="text-sm text-gray-900">
                                {teren.spremnostnacenu ? '✅ Da' : '❌ Ne'}
                                {teren.spremnostnacenuopis && ` - ${teren.spremnostnacenuopis}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Način plaćanja</p>
                              <p className="text-sm text-gray-900">{teren.nacinplacanja || '-'}</p>
                            </div>
                            {teren.detaljitraznje && (
                              <>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Neverbalna komunikacija</p>
                                  <p className="text-sm text-gray-900">{teren.detaljitraznje.neverbalna_komunikacija || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Deal-breaker faktori</p>
                                  <p className="text-sm text-gray-900">{teren.detaljitraznje.deal_breaker_faktori || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Poređenje sa prethodnim</p>
                                  <p className="text-sm text-gray-900">{teren.detaljitraznje.poredjenje_sa_prethodnim || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Hitnost useljenja</p>
                                  <p className="text-sm text-gray-900">{teren.detaljitraznje.hitnost_useljenja || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Emocionalna reakcija</p>
                                  <p className="text-sm text-gray-900">{teren.detaljitraznje.emocionalna_reakcija || '-'}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Levo - Prikaži */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Prikaži:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent backdrop-blur-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            {/* Sredina - Paginacija */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <span className="text-sm font-bold text-emerald-400">{currentPage}</span>
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
            
            {/* Desno - Ukupno */}
            <div className="text-sm text-gray-400 font-medium">
              Ukupno: <span className="text-emerald-400 font-bold">{totalTereni}</span> terena
            </div>
          </div>
        </div>
      )}

      {/* Modal forma */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingTeren ? 'Izmena terena' : 'Novi teren'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Forma */}
            <div className="p-6 space-y-6">
              {/* Ponuda i Tražnja */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ponuda (Prodavac)</label>
                  <select
                    value={formData.idponude}
                    onChange={(e) => setFormData({ ...formData, idponude: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">-- Izaberi ponudu --</option>
                    {ponude.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} - {getProdavacIme(p)} - {p.vrstaobjekta?.opis || ''} {p.kvadratura}m² - {p.cena}€
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tražnja (Kupac)</label>
                  <select
                    value={formData.idtraznja}
                    onChange={(e) => setFormData({ ...formData, idtraznja: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">-- Izaberi tražnju --</option>
                    {traznje.map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.id} - {getKupacIme(t)} - {t.stskupaczakupac}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Komentar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Komentar</label>
                <textarea
                  value={formData.komentar}
                  onChange={(e) => setFormData({ ...formData, komentar: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Opšti komentar o obilasku..."
                />
              </div>

              {/* Utisak kupca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Utisak kupca (1-5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, utisakkupca: star })}
                      className={`text-3xl transition-colors ${star <= formData.utisakkupca ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">({formData.utisakkupca}/5)</span>
                </div>
              </div>

              {/* Pohvale i Zamerke */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Glavne pohvale</label>
                  <textarea
                    value={formData.glavnepohvale}
                    onChange={(e) => setFormData({ ...formData, glavnepohvale: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Šta se kupcu najviše dopalo..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Glavne zamerke</label>
                  <textarea
                    value={formData.glavnezamerke}
                    onChange={(e) => setFormData({ ...formData, glavnezamerke: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Šta kupcu nije odgovaralo..."
                  />
                </div>
              </div>

              {/* Spremnost na cenu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.spremnostnacenu}
                      onChange={(e) => setFormData({ ...formData, spremnostnacenu: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Spremnost na ponuđenu cenu</span>
                  </label>
                  <input
                    type="text"
                    value={formData.spremnostnacenuopis}
                    onChange={(e) => setFormData({ ...formData, spremnostnacenuopis: e.target.value })}
                    className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Dodatni opis (npr. spreman do 95.000€)..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Način plaćanja</label>
                  <input
                    type="text"
                    value={formData.nacinplacanja}
                    onChange={(e) => setFormData({ ...formData, nacinplacanja: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Npr. keš, kredit, kombinacija..."
                  />
                </div>
              </div>

              {/* Detalji tražnje - JSONB */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  Detalji obilaska
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Neverbalna komunikacija</label>
                    <textarea
                      value={formData.detaljitraznje.neverbalna_komunikacija}
                      onChange={(e) => handleDetaljiChange('neverbalna_komunikacija', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Kako je kupac reagovao kada je ušao? Da li se nasmejao ili tražio mane?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deal-breaker faktori</label>
                    <textarea
                      value={formData.detaljitraznje.deal_breaker_faktori}
                      onChange={(e) => handleDetaljiChange('deal_breaker_faktori', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Šta bi ga definitivno odvratilo? (npr. nema lift, buka...)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Poređenje sa prethodnim</label>
                    <textarea
                      value={formData.detaljitraznje.poredjenje_sa_prethodnim}
                      onChange={(e) => handleDetaljiChange('poredjenje_sa_prethodnim', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Kako mu se čini u odnosu na prethodne nekretnine?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hitnost useljenja</label>
                    <textarea
                      value={formData.detaljitraznje.hitnost_useljenja}
                      onChange={(e) => handleDetaljiChange('hitnost_useljenja', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Koliko mu je hitno da se useli? (npr. mora do kraja meseca)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emocionalna reakcija</label>
                    <textarea
                      value={formData.detaljitraznje.emocionalna_reakcija}
                      onChange={(e) => handleDetaljiChange('emocionalna_reakcija', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Emocionalna povezanost sa nekretninom..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dodatne napomene</label>
                    <textarea
                      value={formData.detaljitraznje.dodatne_napomene}
                      onChange={(e) => handleDetaljiChange('dodatne_napomene', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Bilo šta dodatno što je važno zabeležiti..."
                    />
                  </div>
                </div>
              </div>

              {/* Arhiviran */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.arhiviran}
                  onChange={(e) => setFormData({ ...formData, arhiviran: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">Arhivirano</span>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Otkaži
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Čuvam...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Sačuvaj
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
