import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { getCurrentUser } from '../../utils/auth'
import { UserCheck, Search, Filter, ChevronDown, ChevronUp, ExternalLink, Phone, MapPin, Euro, Ruler, Calendar, Archive, ArchiveRestore, Eye, MessageSquare, Send, X, Mail, FileText } from 'lucide-react'

export default function VlasniciModule() {
  const [vlasnici, setVlasnici] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGrad, setFilterGrad] = useState('')
  const [filterOglasnik, setFilterOglasnik] = useState('')
  const [filterRentaProdaja, setFilterRentaProdaja] = useState('')
  const [showArhivirani, setShowArhivirani] = useState(false)
  const [sortColumn, setSortColumn] = useState('datumkreiranja')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedVlasnik, setSelectedVlasnik] = useState(null)
  const [stats, setStats] = useState({ ukupno: 0, aktivni: 0, arhivirani: 0 })
  
  // Komentari state
  const [vlasnicISaKomentarima, setVlasnicISaKomentarima] = useState(new Set())
  const [showKomentarPopup, setShowKomentarPopup] = useState(null)
  const [komentariZaVlasnika, setKomentariZaVlasnika] = useState([])
  const [noviKomentar, setNoviKomentar] = useState('')
  const [loadingKomentari, setLoadingKomentari] = useState(false)
  const [savingKomentar, setSavingKomentar] = useState(false)
  const popupRef = useRef(null)

  useEffect(() => {
    loadVlasnici()
  }, [showArhivirani])

  // Zatvori popup kad se klikne van njega
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowKomentarPopup(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadVlasnici = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('vlasnici')
        .select('*')
        .order('datumkreiranja', { ascending: false })

      if (!showArhivirani) {
        query = query.or('stsarhiviran.is.null,stsarhiviran.eq.false')
      }

      const { data, error } = await query

      if (error) throw error

      setVlasnici(data || [])

      // Učitaj statistiku
      const { count: ukupnoCount } = await supabase
        .from('vlasnici')
        .select('*', { count: 'exact', head: true })

      const { count: arhiviraniCount } = await supabase
        .from('vlasnici')
        .select('*', { count: 'exact', head: true })
        .eq('stsarhiviran', true)

      setStats({
        ukupno: ukupnoCount || 0,
        aktivni: (ukupnoCount || 0) - (arhiviraniCount || 0),
        arhivirani: arhiviraniCount || 0
      })

      // Učitaj koji vlasnici imaju komentare
      const { data: komentariData } = await supabase
        .from('komentar')
        .select('idvlasnici')
      
      if (komentariData) {
        setVlasnicISaKomentarima(new Set(komentariData.map(k => k.idvlasnici)))
      }

    } catch (error) {
      console.error('Greška pri učitavanju vlasnika:', error)
    } finally {
      setLoading(false)
    }
  }

  // Učitaj komentare za određenog vlasnika
  const loadKomentariZaVlasnika = async (vlasnikId) => {
    setLoadingKomentari(true)
    try {
      const { data, error } = await supabase
        .from('komentar')
        .select(`
          *,
          korisnici:userid (naziv, email)
        `)
        .eq('idvlasnici', vlasnikId)
        .order('datumkreiranja', { ascending: false })

      if (error) throw error
      setKomentariZaVlasnika(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju komentara:', error)
    } finally {
      setLoadingKomentari(false)
    }
  }

  // Otvori popup za komentare
  const openKomentarPopup = async (vlasnikId) => {
    setShowKomentarPopup(vlasnikId)
    setNoviKomentar('')
    await loadKomentariZaVlasnika(vlasnikId)
  }

  // Dodaj novi komentar
  const handleDodajKomentar = async (vlasnikId) => {
    if (!noviKomentar.trim()) return
    
    setSavingKomentar(true)
    try {
      const currentUser = getCurrentUser()
      
      const { error } = await supabase
        .from('komentar')
        .insert({
          datumkreiranja: new Date().toISOString(),
          userid: currentUser?.id || null,
          idvlasnici: vlasnikId,
          komentar: noviKomentar.trim()
        })

      if (error) throw error

      // Osveži komentare i listu vlasnika sa komentarima
      setNoviKomentar('')
      await loadKomentariZaVlasnika(vlasnikId)
      setVlasnicISaKomentarima(prev => new Set([...prev, vlasnikId]))
    } catch (error) {
      console.error('Greška pri dodavanju komentara:', error)
      alert('Greška pri dodavanju komentara: ' + error.message)
    } finally {
      setSavingKomentar(false)
    }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleArchive = async (vlasnik) => {
    try {
      const { error } = await supabase
        .from('vlasnici')
        .update({ 
          stsarhiviran: !vlasnik.stsarhiviran,
          datumpromene: new Date().toISOString()
        })
        .eq('id', vlasnik.id)

      if (error) throw error
      loadVlasnici()
    } catch (error) {
      console.error('Greška pri arhiviranju:', error)
      alert('Greška pri arhiviranju: ' + error.message)
    }
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCena = (cena) => {
    if (!cena) return '-'
    return cena.toLocaleString() + '€'
  }

  // Filtriraj i sortiraj
  const filteredAndSortedVlasnici = vlasnici
    .filter(v => {
      const matchesSearch = !searchTerm || 
        (v.imevlasnika?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.kontakttelefon1?.includes(searchTerm)) ||
        (v.kontakttelefon2?.includes(searchTerm)) ||
        (v.lokacija?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.opstina?.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesGrad = !filterGrad || v.grad === filterGrad
      const matchesOglasnik = !filterOglasnik || v.oglasnik === filterOglasnik
      const matchesRentaProdaja = !filterRentaProdaja || v.rentaprodaja === filterRentaProdaja

      return matchesSearch && matchesGrad && matchesOglasnik && matchesRentaProdaja
    })
    .sort((a, b) => {
      let aVal = a[sortColumn]
      let bVal = b[sortColumn]

      if (sortColumn === 'cena' || sortColumn === 'kvadratura') {
        aVal = aVal || 0
        bVal = bVal || 0
      }

      if (sortColumn === 'datumkreiranja') {
        aVal = new Date(aVal || 0)
        bVal = new Date(bVal || 0)
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  // Jedinstvene vrednosti za filtere
  const uniqueGradovi = [...new Set(vlasnici.map(v => v.grad).filter(Boolean))]
  const uniqueOglasnici = [...new Set(vlasnici.map(v => v.oglasnik).filter(Boolean))]

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return <ChevronDown className="w-4 h-4 text-gray-300" />
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-amber-500" />
      : <ChevronDown className="w-4 h-4 text-amber-500" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Vlasnici</h2>
          <p className="text-gray-500 text-sm mt-1">Pregled svih vlasnika iz scraping-a</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Statistika kao badge-evi */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Ukupno: {stats.ukupno}
            </span>
            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Aktivni: {stats.aktivni}
            </span>
            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              Arhivirani: {stats.arhivirani}
            </span>
          </div>
        </div>
      </div>

      {/* Filteri */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži po imenu, telefonu, lokaciji..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filterGrad}
            onChange={(e) => setFilterGrad(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Svi gradovi</option>
            {uniqueGradovi.map(grad => (
              <option key={grad} value={grad}>{grad}</option>
            ))}
          </select>

          <select
            value={filterOglasnik}
            onChange={(e) => setFilterOglasnik(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Svi oglasnici</option>
            {uniqueOglasnici.map(oglasnik => (
              <option key={oglasnik} value={oglasnik}>{oglasnik}</option>
            ))}
          </select>

          <select
            value={filterRentaProdaja}
            onChange={(e) => setFilterRentaProdaja(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Sve vrste</option>
            <option value="prodaja">Prodaja</option>
            <option value="renta">Renta</option>
          </select>

          <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100">
            <input
              type="checkbox"
              checked={showArhivirani}
              onChange={(e) => setShowArhivirani(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded"
            />
            <span className="text-sm text-gray-700">Prikaži arhivirane</span>
          </label>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Učitavam vlasnike...</p>
          </div>
        ) : filteredAndSortedVlasnici.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema vlasnika</h3>
            <p className="text-gray-500">Pokrenite scraping da biste dodali vlasnike</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <button onClick={() => handleSort('datumkreiranja')} className="flex items-center gap-1">
                      Datum <SortIcon column="datumkreiranja" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Vlasnik</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Kontakt</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Lokacija</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <button onClick={() => handleSort('cena')} className="flex items-center gap-1">
                      Cena <SortIcon column="cena" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <button onClick={() => handleSort('kvadratura')} className="flex items-center gap-1">
                      m² <SortIcon column="kvadratura" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Oglasnik</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedVlasnici.map((vlasnik, index) => (
                  <tr 
                    key={vlasnik.id} 
                    className={`hover:bg-gray-50 ${vlasnik.stsarhiviran ? 'bg-gray-50 opacity-60' : ''} ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-gray-900">{vlasnik.datumkreiranja ? new Date(vlasnik.datumkreiranja).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</div>
                          <div className="text-gray-500 text-xs">{vlasnik.datumkreiranja ? new Date(vlasnik.datumkreiranja).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{vlasnik.imevlasnika || '-'}</div>
                      {vlasnik.rentaprodaja && (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          vlasnik.rentaprodaja === 'prodaja' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {vlasnik.rentaprodaja}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {vlasnik.kontakttelefon1 && (
                          <div className="flex items-center gap-1 text-sm text-blue-600">
                            <Phone className="w-3 h-3" />
                            {vlasnik.kontakttelefon1}
                          </div>
                        )}
                        {vlasnik.kontakttelefon2 && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {vlasnik.kontakttelefon2}
                          </div>
                        )}
                        {vlasnik.email && (
                          <div className="flex items-center gap-1 text-sm text-purple-600">
                            <Mail className="w-3 h-3" />
                            <a href={`mailto:${vlasnik.email}`} className="hover:underline">{vlasnik.email}</a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-1 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-gray-900">{vlasnik.grad || '-'}</div>
                          {vlasnik.opstina && <div className="text-gray-500">{vlasnik.opstina}</div>}
                          {vlasnik.lokacija && <div className="text-gray-400 text-xs">{vlasnik.lokacija}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Euro className="w-4 h-4 text-green-500" />
                        {formatCena(vlasnik.cena)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Ruler className="w-4 h-4 text-gray-400" />
                        {vlasnik.kvadratura ? `${vlasnik.kvadratura}m²` : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-lg">
                        {vlasnik.oglasnik || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 relative">
                        {vlasnik.linkoglasa && (
                          <a
                            href={vlasnik.linkoglasa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Otvori oglas"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedVlasnik(vlasnik)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Detalji"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* Dugme za komentar */}
                        <div className="relative">
                          <button
                            onClick={() => openKomentarPopup(vlasnik.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              vlasnicISaKomentarima.has(vlasnik.id)
                                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title={vlasnicISaKomentarima.has(vlasnik.id) ? 'Ima komentare' : 'Dodaj komentar'}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Inline popup za komentare */}
                          {showKomentarPopup === vlasnik.id && (
                            <div 
                              ref={popupRef}
                              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border-2 border-orange-200 z-50 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Header - narandžasti gradient */}
                              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-5 h-5 text-white" />
                                  <h4 className="font-bold text-white">Komentari</h4>
                                  {komentariZaVlasnika.length > 0 && (
                                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                      {komentariZaVlasnika.length}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => setShowKomentarPopup(null)}
                                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                  <X className="w-5 h-5 text-white" />
                                </button>
                              </div>

                              {/* Lista komentara */}
                              <div className="max-h-56 overflow-y-auto p-4 space-y-3 bg-orange-50/50">
                                {loadingKomentari ? (
                                  <div className="text-center py-6">
                                    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-sm text-orange-600 mt-2">Učitavam...</p>
                                  </div>
                                ) : komentariZaVlasnika.length === 0 ? (
                                  <div className="text-center py-6">
                                    <MessageSquare className="w-12 h-12 text-orange-200 mx-auto mb-2" />
                                    <p className="text-sm text-orange-400 font-medium">Nema komentara</p>
                                    <p className="text-xs text-orange-300">Budite prvi koji će ostaviti komentar</p>
                                  </div>
                                ) : (
                                  komentariZaVlasnika.map((k) => (
                                    <div key={k.id} className="bg-white rounded-xl p-3 shadow-sm border border-orange-100">
                                      <p className="text-sm text-gray-800 leading-relaxed">{k.komentar}</p>
                                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-orange-100">
                                        <span className="text-xs font-medium text-orange-600">
                                          {k.korisnici?.naziv || k.korisnici?.email || 'Nepoznat'}
                                        </span>
                                        <span className="text-xs text-gray-400">{formatDateTime(k.datumkreiranja)}</span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Forma za novi komentar */}
                              <div className="border-t-2 border-orange-200 p-4 bg-white">
                                <label className="block text-xs font-semibold text-orange-600 mb-2">Novi komentar</label>
                                <textarea
                                  value={noviKomentar}
                                  onChange={(e) => setNoviKomentar(e.target.value)}
                                  placeholder="Unesite komentar..."
                                  className="w-full text-sm border-2 border-orange-200 rounded-xl p-3 resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-orange-50/50 placeholder-orange-300"
                                  rows={3}
                                />
                                <button
                                  onClick={() => handleDodajKomentar(vlasnik.id)}
                                  disabled={!noviKomentar.trim() || savingKomentar}
                                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30"
                                >
                                  {savingKomentar ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <>
                                      <Send className="w-5 h-5" />
                                      Dodaj komentar
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleArchive(vlasnik)}
                          className={`p-2 rounded-lg transition-colors ${
                            vlasnik.stsarhiviran 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          title={vlasnik.stsarhiviran ? 'Dearhiviraj' : 'Arhiviraj'}
                        >
                          {vlasnik.stsarhiviran ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer sa brojem rezultata */}
        {!loading && filteredAndSortedVlasnici.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Prikazano {filteredAndSortedVlasnici.length} od {vlasnici.length} vlasnika
            </p>
          </div>
        )}
      </div>

      {/* Modal za detalje */}
      {selectedVlasnik && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Detalji vlasnika</h3>
                <button
                  onClick={() => setSelectedVlasnik(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Ime vlasnika</label>
                  <p className="font-medium text-gray-900">{selectedVlasnik.imevlasnika || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tip</label>
                  <p className="font-medium text-gray-900">{selectedVlasnik.rentaprodaja || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Telefon 1</label>
                  <p className="font-medium text-blue-600">{selectedVlasnik.kontakttelefon1 || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Telefon 2</label>
                  <p className="font-medium text-blue-600">{selectedVlasnik.kontakttelefon2 || '-'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  {selectedVlasnik.email ? (
                    <a 
                      href={`mailto:${selectedVlasnik.email}`}
                      className="font-medium text-purple-600 hover:underline"
                    >
                      {selectedVlasnik.email}
                    </a>
                  ) : (
                    <p className="font-medium text-gray-400">-</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500">Grad</label>
                  <p className="font-medium text-gray-900">{selectedVlasnik.grad || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Opština</label>
                  <p className="font-medium text-gray-900">{selectedVlasnik.opstina || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Lokacija</label>
                  <p className="font-medium text-gray-900">{selectedVlasnik.lokacija || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Cena</label>
                  <p className="font-medium text-green-600">{formatCena(selectedVlasnik.cena)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Kvadratura</label>
                  <p className="font-medium text-gray-900">{selectedVlasnik.kvadratura ? `${selectedVlasnik.kvadratura}m²` : '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Oglasnik</label>
                  <p className="font-medium text-purple-600">{selectedVlasnik.oglasnik || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Datum kreiranja</label>
                  <p className="font-medium text-gray-900">{formatDate(selectedVlasnik.datumkreiranja)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">ID oglasa</label>
                  <p className="font-medium text-gray-500 text-xs">{selectedVlasnik.idoglasa || '-'}</p>
                </div>
              </div>
              
              {/* Opis oglasa (naslov) */}
              {selectedVlasnik.opisoglasa && (
                <div>
                  <label className="text-sm text-gray-500">Naslov oglasa</label>
                  <p className="font-medium text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{selectedVlasnik.opisoglasa}</p>
                </div>
              )}
              
              {/* Dodatni opis (puni tekst) */}
              {selectedVlasnik.dodatniopis && (
                <div>
                  <label className="text-sm text-gray-500 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Dodatni opis
                  </label>
                  <div className="mt-1 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{selectedVlasnik.dodatniopis}</p>
                  </div>
                </div>
              )}
              {selectedVlasnik.linkoglasa && (
                <a
                  href={selectedVlasnik.linkoglasa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Otvori oglas
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
