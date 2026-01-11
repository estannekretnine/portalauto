import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../utils/supabase'
import { Search, X, Grid, List, Image as ImageIcon, MapPin, Home, Ruler, DollarSign, Plus } from 'lucide-react'
import PonudaForm from './PonudaForm'

export default function PonudeModule() {
  console.log('🔵 PonudeModule montiran')
  const [ponude, setPonude] = useState([])
  const [vrsteObjekata, setVrsteObjekata] = useState([])
  const [lokacije, setLokacije] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('table') // 'table' ili 'grid'
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
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
      
      // Kreiraj query za osnovne podatke
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

      // Aplikuj osnovne filtere
      if (filters.stsaktivan !== null && filters.stsaktivan !== undefined) {
        query = query.eq('stsaktivan', filters.stsaktivan)
      }
      if (filters.stsrentaprodaja) {
        query = query.eq('stsrentaprodaja', filters.stsrentaprodaja)
      }

      // Aplikuj dodatne filtere
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

      // Učitaj sve relacione podatke odjednom (batching za performanse)
      const vrstaIds = [...new Set((data || []).map(p => p.idvrstaobjekta).filter(Boolean))]
      const opstinaIds = [...new Set((data || []).map(p => p.idopstina).filter(Boolean))]
      const lokacijaIds = [...new Set((data || []).map(p => p.idlokacija).filter(Boolean))]
      const ulicaIds = [...new Set((data || []).map(p => p.idulica).filter(Boolean))]
      const ponudaIds = (data || []).map(p => p.id)

      // Učitaj sve relacione podatke paralelno
      const [vrsteResult, opstineResult, lokacijeResult, uliceResult, fotografijeResult] = await Promise.all([
        vrstaIds.length > 0 ? supabase.from('vrstaobjekta').select('id, opis').in('id', vrstaIds) : Promise.resolve({ data: [] }),
        opstinaIds.length > 0 ? supabase.from('opstina').select('id, opis').in('id', opstinaIds) : Promise.resolve({ data: [] }),
        lokacijaIds.length > 0 ? supabase.from('lokacija').select('id, opis').in('id', lokacijaIds) : Promise.resolve({ data: [] }),
        ulicaIds.length > 0 ? supabase.from('ulica').select('id, opis').in('id', ulicaIds) : Promise.resolve({ data: [] }),
        ponudaIds.length > 0 ? supabase.from('ponudafoto').select('*').in('idponude', ponudaIds) : Promise.resolve({ data: [] })
      ])

      // Kreiraj lookup mape za brže pristupanje
      const vrsteMap = new Map((vrsteResult.data || []).map(v => [v.id, v]))
      const opstineMap = new Map((opstineResult.data || []).map(o => [o.id, o]))
      const lokacijeMap = new Map((lokacijeResult.data || []).map(l => [l.id, l]))
      const uliceMap = new Map((uliceResult.data || []).map(u => [u.id, u]))
      const fotografijeMap = new Map()
      
      // Grupiši fotografije po ponudama i sortiraj
      if (fotografijeResult.data) {
        fotografijeResult.data.forEach(foto => {
          if (!fotografijeMap.has(foto.idponude)) {
            fotografijeMap.set(foto.idponude, [])
          }
          fotografijeMap.get(foto.idponude).push(foto)
        })
        
        // Sortiraj fotografije za svaku ponudu (prvo glavna, zatim po redosledu)
        fotografijeMap.forEach((fotos, ponudaId) => {
          fotos.sort((a, b) => {
            if (a.glavna && !b.glavna) return -1
            if (!a.glavna && b.glavna) return 1
            return (a.redosled || 0) - (b.redosled || 0)
          })
        })
      }

      // Mapiraj ponude sa relacijama
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
      currency: 'RSD',
      minimumFractionDigits: 0
    }).format(cena)
  }

  if (loading) {
    console.log('⏳ PonudeModule: Loading state - true')
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Učitavanje ponuda...</div>
      </div>
    )
  }
  
  console.log('✅ PonudeModule: Loading complete, ponude count:', ponude.length)

  const handleAddPonuda = () => {
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    loadPonude()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header sa filter i view toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Ponude</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleAddPonuda}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Dodaj ponudu</span>
            <span className="sm:hidden">Dodaj</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              showFilters
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Pretraga</span>
            <span className="sm:hidden">Filter</span>
          </button>
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Tabelarni prikaz"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Web portal prikaz"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Pretraga ponuda</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={resetFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Resetuj
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Vrsta objekta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vrsta objekta
              </label>
              <select
                value={filters.idvrstaobjekta}
                onChange={(e) => handleFilterChange('idvrstaobjekta', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Sve vrste</option>
                {vrsteObjekata.map(vrsta => (
                  <option key={vrsta.id} value={vrsta.id}>
                    {vrsta.opis}
                  </option>
                ))}
              </select>
            </div>

            {/* Kvadratura od */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kvadratura od (m²)
              </label>
              <input
                type="number"
                value={filters.kvadraturaOd}
                onChange={(e) => handleFilterChange('kvadraturaOd', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            {/* Kvadratura do */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kvadratura do (m²)
              </label>
              <input
                type="number"
                value={filters.kvadraturaDo}
                onChange={(e) => handleFilterChange('kvadraturaDo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="9999"
              />
            </div>

            {/* Struktura od */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Struktura od (m²)
              </label>
              <input
                type="number"
                step="0.01"
                value={filters.strukturaOd}
                onChange={(e) => handleFilterChange('strukturaOd', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            {/* Struktura do */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Struktura do (m²)
              </label>
              <input
                type="number"
                step="0.01"
                value={filters.strukturaDo}
                onChange={(e) => handleFilterChange('strukturaDo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="9999"
              />
            </div>

            {/* Cena od */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cena od (RSD)
              </label>
              <input
                type="number"
                value={filters.cenaOd}
                onChange={(e) => handleFilterChange('cenaOd', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            {/* Cena do */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cena do (RSD)
              </label>
              <input
                type="number"
                value={filters.cenaDo}
                onChange={(e) => handleFilterChange('cenaDo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="999999999"
              />
            </div>

            {/* Status aktivan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status aktivan
              </label>
              <select
                value={filters.stsaktivan ? 'true' : 'false'}
                onChange={(e) => handleFilterChange('stsaktivan', e.target.value === 'true')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="true">Aktivan</option>
                <option value="false">Neaktivan</option>
              </select>
            </div>

            {/* Rent/Prodaja */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rent/Prodaja
              </label>
              <select
                value={filters.stsrentaprodaja}
                onChange={(e) => handleFilterChange('stsrentaprodaja', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="prodaja">Prodaja</option>
                <option value="renta">Renta</option>
                <option value="">Sve</option>
              </select>
            </div>

            {/* Lokacije - Multi-select */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokacije (možete izabrati više)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2 bg-white">
                {lokacije.length === 0 ? (
                  <p className="text-sm text-gray-500">Nema dostupnih lokacija</p>
                ) : (
                  lokacije.map(lokacija => (
                    <label key={lokacija.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={filters.idlokacija?.includes(lokacija.id) || false}
                        onChange={() => handleLokacijaToggle(lokacija.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{lokacija.opis}</span>
                    </label>
                  ))
                )}
              </div>
              {filters.idlokacija && filters.idlokacija.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Izabrano: {filters.idlokacija.length} lokacija
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prikaz ponuda */}
      {ponude.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nema ponuda</p>
          <p className="text-gray-500">Nema ponuda koje odgovaraju vašim kriterijumima.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Tabelarni prikaz */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vrsta objekta
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opština
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokacija
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ulica
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kvadratura (m²)
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Struktura (m²)
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cena
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rent/Prodaja
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ponude.map((ponuda) => (
                  <tr key={ponuda.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ponuda.id}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ponuda.vrstaobjekta?.opis || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ponuda.opstina?.opis || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ponuda.lokacija?.opis || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ponuda.ulica?.opis || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ponuda.kvadratura ? `${ponuda.kvadratura} m²` : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ponuda.struktura ? `${ponuda.struktura} m²` : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCena(ponuda.cena)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ponuda.stsaktivan
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {ponuda.stsaktivan ? 'Aktivan' : 'Neaktivan'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ponuda.stsrentaprodaja === 'prodaja' ? 'Prodaja' : 'Renta'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Web portal grid prikaz */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {ponude.map((ponuda) => (
            <div
              key={ponuda.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Fotografija */}
              <div className="relative h-48 bg-gray-200">
                {ponuda.fotografija?.url ? (
                  <img
                    src={ponuda.fotografija.url}
                    alt={ponuda.fotografija.opis || 'Ponuda'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="18" fill="%239ca3af" text-anchor="middle" dy=".3em"%3ENema slike%3C/text%3E%3C/svg%3E'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-indigo-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {formatCena(ponuda.cena)}
                </div>
              </div>

              {/* Podaci */}
              <div className="p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ponuda.opstina?.opis || '-'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {ponuda.lokacija?.opis || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {ponuda.kvadratura && (
                    <div className="flex items-center gap-1">
                      <Ruler className="w-3 h-3" />
                      <span>{ponuda.kvadratura} m²</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm font-semibold text-indigo-600">
                    {formatCena(ponuda.cena)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Forma za dodavanje nove ponude */}
      {showForm && (
        <PonudaForm
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
