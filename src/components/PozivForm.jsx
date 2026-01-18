import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabase'
import { X, Phone, Save, Loader2, Home, FileSearch, MessageSquare, User, ChevronDown, Brain, Sparkles, Target, MapPin, Euro, Ban, Heart, Users, Briefcase, Car, PawPrint, Wifi } from 'lucide-react'
import { getCurrentUser } from '../utils/auth'

export default function PozivForm({ poziv, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [loadingPonude, setLoadingPonude] = useState(false)
  const [loadingTraznje, setLoadingTraznje] = useState(false)
  
  // Refs za dropdown zatvaranje
  const ponudaDropdownRef = useRef(null)
  const traznjaDropdownRef = useRef(null)
  
  // Osnovni podaci
  const [formData, setFormData] = useState({
    idponude: poziv?.idponude || '',
    idtraznja: poziv?.idtraznja || '',
    stspoziv: poziv?.stspoziv || '',
    komentar: poziv?.komentar || '',
    arhiviran: poziv?.arhiviran || false
  })

  // AI Karakteristike
  const [aiKarakteristike, setAiKarakteristike] = useState(poziv?.ai_karakteristike || {
    // 1. Motivacija
    motivacija: {
      sta_privuklo: '',
      cilj_kupovine: '', // 'zivot' | 'investicija'
      koliko_dugo_trazi: '' // 'do_mesec' | '1_3_meseca' | '3_6_meseci' | 'preko_6_meseci'
    },
    // 2. Fleksibilnost
    fleksibilnost: {
      lokacija_fiksna: false,
      susedne_opstine: false,
      geografski_radijus: '',
      budzet_idealan: '',
      budzet_max: '',
      prioritet_struktura_ili_kvadratura: '' // 'struktura' | 'kvadratura' | 'oba'
    },
    // 3. Dealbreakeri
    dealbreakeri: {
      ne_dolazi_u_obzir: [], // ['potkrovlje', 'prizemlje', 'grejanje_struja', 'bez_lifta']
      parking_neophodan: false,
      garaza_neophodna: false,
      nacin_finansiranja: '' // 'kes' | 'kredit' | 'prodaja_nekretnine' | 'kombinacija'
    },
    // 4. Profilisanje
    profilisanje: {
      broj_clanova_domacinstva: '',
      rad_od_kuce: false,
      kucni_ljubimci: false,
      posebni_zahtevi: ''
    },
    // Dodatno
    primarni_motiv: '',
    must_have: [],
    napomena: ''
  })

  // Lookup podaci
  const [ponude, setPonude] = useState([])
  const [traznje, setTraznje] = useState([])
  const [ponudaSearch, setPonudaSearch] = useState('')
  const [traznjaSearch, setTraznjaSearch] = useState('')
  const [showPonudaDropdown, setShowPonudaDropdown] = useState(false)
  const [showTraznjaDropdown, setShowTraznjaDropdown] = useState(false)
  const [selectedPonuda, setSelectedPonuda] = useState(null)
  const [selectedTraznja, setSelectedTraznja] = useState(null)

  // Status poziva opcije
  const statusOptions = [
    { value: 'novikupac', label: 'Novi kupac', color: 'bg-emerald-100 text-emerald-800', description: 'Telefon ne postoji u tražnji i u pozivima' },
    { value: 'starikupac', label: 'Stari kupac', color: 'bg-blue-100 text-blue-800', description: 'Postojeći kupac' },
    { value: 'prodavac', label: 'Prodavac', color: 'bg-amber-100 text-amber-800', description: 'Poziv od prodavca' },
    { value: 'agencija', label: 'Agencija', color: 'bg-purple-100 text-purple-800', description: 'Poziv od agencije' },
    { value: 'ostalo', label: 'Ostalo', color: 'bg-gray-100 text-gray-800', description: 'Ostali pozivi' }
  ]

  // Dealbreaker opcije
  const dealbreakerOptions = [
    { value: 'potkrovlje', label: 'Potkrovlje' },
    { value: 'prizemlje', label: 'Prizemlje' },
    { value: 'grejanje_struja', label: 'Grejanje na struju' },
    { value: 'bez_lifta', label: 'Zgrada bez lifta' },
    { value: 'prometna_ulica', label: 'Prometna ulica' },
    { value: 'suteren', label: 'Suteren' },
    { value: 'zadnji_sprat', label: 'Zadnji sprat' },
    { value: 'stara_gradnja', label: 'Stara gradnja' }
  ]

  // Must-have opcije
  const mustHaveOptions = [
    { value: 'lift', label: 'Lift' },
    { value: 'centralno_grejanje', label: 'Centralno grejanje' },
    { value: 'terasa', label: 'Terasa' },
    { value: 'balkon', label: 'Balkon' },
    { value: 'parking', label: 'Parking' },
    { value: 'garaza', label: 'Garaža' },
    { value: 'novogradnja', label: 'Novogradnja' },
    { value: 'renoviran', label: 'Renoviran' },
    { value: 'klima', label: 'Klima' },
    { value: 'internet', label: 'Optički internet' }
  ]

  useEffect(() => {
    loadPonude()
    loadTraznje()
    
    // Ako editujemo, učitaj selektovane
    if (poziv?.idponude) {
      loadSelectedPonuda(poziv.idponude)
    }
    if (poziv?.idtraznja) {
      loadSelectedTraznja(poziv.idtraznja)
    }
  }, [])

  // Zatvori dropdown kada se klikne van
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ponudaDropdownRef.current && !ponudaDropdownRef.current.contains(event.target)) {
        setShowPonudaDropdown(false)
      }
      if (traznjaDropdownRef.current && !traznjaDropdownRef.current.contains(event.target)) {
        setShowTraznjaDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadSelectedPonuda = async (id) => {
    const { data } = await supabase
      .from('ponuda')
      .select('id, kontaktosoba, kontakttelefon')
      .eq('id', id)
      .single()
    if (data) setSelectedPonuda(data)
  }

  const loadSelectedTraznja = async (id) => {
    const { data } = await supabase
      .from('traznja')
      .select('id, kontaktosoba, kontakttelefon')
      .eq('id', id)
      .single()
    if (data) setSelectedTraznja(data)
  }

  const loadPonude = async () => {
    setLoadingPonude(true)
    try {
      const { data, error } = await supabase
        .from('ponuda')
        .select('id, kontaktosoba, kontakttelefon')
        .eq('stsaktivan', true)
        .order('id', { ascending: false })
        .limit(100)
      
      if (error) throw error
      setPonude(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju ponuda:', error)
    } finally {
      setLoadingPonude(false)
    }
  }

  const loadTraznje = async () => {
    setLoadingTraznje(true)
    try {
      const { data, error } = await supabase
        .from('traznja')
        .select('id, kontaktosoba, kontakttelefon')
        .eq('stsaktivan', true)
        .order('id', { ascending: false })
        .limit(100)
      
      if (error) throw error
      setTraznje(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju tražnji:', error)
    } finally {
      setLoadingTraznje(false)
    }
  }

  const filteredPonude = ponude.filter(p => 
    !ponudaSearch || 
    p.kontaktosoba?.toLowerCase().includes(ponudaSearch.toLowerCase()) ||
    p.kontakttelefon?.includes(ponudaSearch) ||
    String(p.id).includes(ponudaSearch)
  ).slice(0, 20)

  const filteredTraznje = traznje.filter(t => 
    !traznjaSearch || 
    t.kontaktosoba?.toLowerCase().includes(traznjaSearch.toLowerCase()) ||
    t.kontakttelefon?.includes(traznjaSearch) ||
    String(t.id).includes(traznjaSearch)
  ).slice(0, 20)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAiChange = (section, field, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleAiArrayToggle = (section, field, value) => {
    setAiKarakteristike(prev => {
      const currentArray = prev[section]?.[field] || []
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value]
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      }
    })
  }

  const handleMustHaveToggle = (value) => {
    setAiKarakteristike(prev => {
      const currentArray = prev.must_have || []
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value]
      return {
        ...prev,
        must_have: newArray
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const currentUser = getCurrentUser()
      
      const dataToSave = {
        idponude: formData.idponude || null,
        idtraznja: formData.idtraznja || null,
        stspoziv: formData.stspoziv || null,
        komentar: formData.komentar || null,
        arhiviran: formData.arhiviran || false,
        ai_karakteristike: aiKarakteristike,
        iduser: currentUser?.id || null,
        datumpromene: new Date().toISOString()
      }

      if (poziv?.id) {
        // Update
        const { error } = await supabase
          .from('pozivi')
          .update(dataToSave)
          .eq('id', poziv.id)

        if (error) throw error
      } else {
        // Insert
        dataToSave.datumkreiranja = new Date().toISOString()
        const { error } = await supabase
          .from('pozivi')
          .insert([dataToSave])

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('Greška pri čuvanju poziva:', error)
      alert('Greška pri čuvanju poziva: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-black px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {poziv ? 'Izmeni poziv' : 'Novi poziv'}
              </h3>
              <p className="text-gray-400 text-xs">Unesite podatke o pozivu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Osnovni podaci */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-500" />
              Osnovni podaci
            </h4>

            {/* Status poziva */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status poziva *</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('stspoziv', option.value)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      formData.stspoziv === option.value
                        ? option.color + ' ring-2 ring-offset-1 ring-gray-400'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ponuda (Prodavac) */}
            <div className="relative" ref={ponudaDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Home className="w-4 h-4 inline mr-1 text-amber-500" />
                Ponuda (Prodavac)
              </label>
              {selectedPonuda ? (
                <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Home className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{selectedPonuda.kontaktosoba || 'Bez imena'}</span>
                      <span className="text-xs text-gray-500 ml-2">{selectedPonuda.kontakttelefon}</span>
                    </div>
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-lg font-medium">#{selectedPonuda.id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPonuda(null)
                      handleChange('idponude', '')
                      setPonudaSearch('')
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ponudaSearch}
                      onChange={(e) => {
                        setPonudaSearch(e.target.value)
                        setShowPonudaDropdown(true)
                      }}
                      onFocus={() => setShowPonudaDropdown(true)}
                      placeholder="Pretraži ponude po imenu, telefonu ili ID..."
                      className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPonudaDropdown(!showPonudaDropdown)}
                      className="px-4 py-3 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl transition-colors"
                    >
                      <ChevronDown className={`w-5 h-5 transition-transform ${showPonudaDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {showPonudaDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      {loadingPonude ? (
                        <div className="px-4 py-3 text-center text-gray-500">Učitavanje...</div>
                      ) : filteredPonude.length > 0 ? (
                        filteredPonude.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPonuda(p)
                              handleChange('idponude', p.id)
                              setPonudaSearch('')
                              setShowPonudaDropdown(false)
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-amber-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                          >
                            <div>
                              <span className="font-medium text-gray-900">{p.kontaktosoba || 'Bez imena'}</span>
                              <span className="text-xs text-gray-500 ml-2">{p.kontakttelefon}</span>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">#{p.id}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-gray-500">Nema rezultata</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tražnja (Kupac) */}
            <div className="relative" ref={traznjaDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileSearch className="w-4 h-4 inline mr-1 text-blue-500" />
                Tražnja (Kupac)
              </label>
              {selectedTraznja ? (
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileSearch className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{selectedTraznja.kontaktosoba || 'Bez imena'}</span>
                      <span className="text-xs text-gray-500 ml-2">{selectedTraznja.kontakttelefon}</span>
                    </div>
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-lg font-medium">#{selectedTraznja.id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTraznja(null)
                      handleChange('idtraznja', '')
                      setTraznjaSearch('')
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={traznjaSearch}
                      onChange={(e) => {
                        setTraznjaSearch(e.target.value)
                        setShowTraznjaDropdown(true)
                      }}
                      onFocus={() => setShowTraznjaDropdown(true)}
                      placeholder="Pretraži tražnje po imenu, telefonu ili ID..."
                      className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTraznjaDropdown(!showTraznjaDropdown)}
                      className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors"
                    >
                      <ChevronDown className={`w-5 h-5 transition-transform ${showTraznjaDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {showTraznjaDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      {loadingTraznje ? (
                        <div className="px-4 py-3 text-center text-gray-500">Učitavanje...</div>
                      ) : filteredTraznje.length > 0 ? (
                        filteredTraznje.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTraznja(t)
                              handleChange('idtraznja', t.id)
                              setTraznjaSearch('')
                              setShowTraznjaDropdown(false)
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                          >
                            <div>
                              <span className="font-medium text-gray-900">{t.kontaktosoba || 'Bez imena'}</span>
                              <span className="text-xs text-gray-500 ml-2">{t.kontakttelefon}</span>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">#{t.id}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-gray-500">Nema rezultata</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Komentar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1 text-gray-500" />
                Komentar
              </label>
              <textarea
                value={formData.komentar}
                onChange={(e) => handleChange('komentar', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                placeholder="Unesite komentar o pozivu..."
              />
            </div>
          </div>

          {/* AI Karakteristike */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-5 space-y-5 border border-purple-100">
            <h4 className="font-semibold text-purple-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Karakteristike kupca
              <span className="text-xs font-normal text-purple-600 ml-2">(za AI preporuke)</span>
            </h4>

            {/* 1. Motivacija */}
            <div className="bg-white rounded-xl p-4 space-y-4">
              <h5 className="font-medium text-gray-800 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                1. Motivacija i "Zašto baš ovaj oglas?"
              </h5>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Šta vam je prvo privuklo pažnju kod ovog oglasa?</label>
                <input
                  type="text"
                  value={aiKarakteristike.motivacija?.sta_privuklo || ''}
                  onChange={(e) => handleAiChange('motivacija', 'sta_privuklo', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="npr. terasa, lokacija, moderan dizajn..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Da li tražite nekretninu za život ili kao investiciju?</label>
                <div className="flex gap-2">
                  {[
                    { value: 'zivot', label: '🏠 Za život' },
                    { value: 'investicija', label: '📈 Investicija' },
                    { value: 'oba', label: '🔄 Oba' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAiChange('motivacija', 'cilj_kupovine', option.value)}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        aiKarakteristike.motivacija?.cilj_kupovine === option.value
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Koliko dugo već aktivno tražite?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'do_mesec', label: 'Do mesec dana' },
                    { value: '1_3_meseca', label: '1-3 meseca' },
                    { value: '3_6_meseci', label: '3-6 meseci' },
                    { value: 'preko_6_meseci', label: 'Preko 6 meseci' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAiChange('motivacija', 'koliko_dugo_trazi', option.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        aiKarakteristike.motivacija?.koliko_dugo_trazi === option.value
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Fleksibilnost */}
            <div className="bg-white rounded-xl p-4 space-y-4">
              <h5 className="font-medium text-gray-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                2. Parametri fleksibilnosti
              </h5>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={aiKarakteristike.fleksibilnost?.lokacija_fiksna || false}
                    onChange={(e) => handleAiChange('fleksibilnost', 'lokacija_fiksna', e.target.checked)}
                    className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Lokacija je fiksna</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={aiKarakteristike.fleksibilnost?.susedne_opstine || false}
                    onChange={(e) => handleAiChange('fleksibilnost', 'susedne_opstine', e.target.checked)}
                    className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Razmatra susedne opštine</span>
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Geografski radijus pretrage</label>
                <input
                  type="text"
                  value={aiKarakteristike.fleksibilnost?.geografski_radijus || ''}
                  onChange={(e) => handleAiChange('fleksibilnost', 'geografski_radijus', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="npr. Vračar + 2km radijus"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    <Euro className="w-3 h-3 inline mr-1" />
                    Idealan budžet (€)
                  </label>
                  <input
                    type="number"
                    value={aiKarakteristike.fleksibilnost?.budzet_idealan || ''}
                    onChange={(e) => handleAiChange('fleksibilnost', 'budzet_idealan', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="150000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    <Euro className="w-3 h-3 inline mr-1" />
                    Maksimalan budžet (€)
                  </label>
                  <input
                    type="number"
                    value={aiKarakteristike.fleksibilnost?.budzet_max || ''}
                    onChange={(e) => handleAiChange('fleksibilnost', 'budzet_max', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="175000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Šta je važnije - struktura ili kvadratura?</label>
                <div className="flex gap-2">
                  {[
                    { value: 'struktura', label: '🚪 Struktura (broj soba)' },
                    { value: 'kvadratura', label: '📐 Kvadratura' },
                    { value: 'oba', label: '⚖️ Oba podjednako' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAiChange('fleksibilnost', 'prioritet_struktura_ili_kvadratura', option.value)}
                      className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        aiKarakteristike.fleksibilnost?.prioritet_struktura_ili_kvadratura === option.value
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Dealbreakeri */}
            <div className="bg-white rounded-xl p-4 space-y-4">
              <h5 className="font-medium text-gray-800 flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-500" />
                3. Dealbreakeri (šta nikako ne dolazi u obzir)
              </h5>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Šta nikako ne dolazi u obzir?</label>
                <div className="flex flex-wrap gap-2">
                  {dealbreakerOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAiArrayToggle('dealbreakeri', 'ne_dolazi_u_obzir', option.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        (aiKarakteristike.dealbreakeri?.ne_dolazi_u_obzir || []).includes(option.value)
                          ? 'bg-red-100 text-red-800 ring-1 ring-red-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={aiKarakteristike.dealbreakeri?.parking_neophodan || false}
                    onChange={(e) => handleAiChange('dealbreakeri', 'parking_neophodan', e.target.checked)}
                    className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    <Car className="w-4 h-4 inline mr-1" />
                    Parking neophodan
                  </span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={aiKarakteristike.dealbreakeri?.garaza_neophodna || false}
                    onChange={(e) => handleAiChange('dealbreakeri', 'garaza_neophodna', e.target.checked)}
                    className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    <Car className="w-4 h-4 inline mr-1" />
                    Garaža neophodna
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Način finansiranja</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'kes', label: '💵 Keš' },
                    { value: 'kredit', label: '🏦 Kredit' },
                    { value: 'prodaja_nekretnine', label: '🏠 Prodaja nekretnine' },
                    { value: 'kombinacija', label: '🔄 Kombinacija' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAiChange('dealbreakeri', 'nacin_finansiranja', option.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        aiKarakteristike.dealbreakeri?.nacin_finansiranja === option.value
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Profilisanje */}
            <div className="bg-white rounded-xl p-4 space-y-4">
              <h5 className="font-medium text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                4. Kontekstualna pitanja za profilisanje
              </h5>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Koliko članova domaćinstva će živeti u nekretnini?</label>
                <input
                  type="number"
                  min="1"
                  value={aiKarakteristike.profilisanje?.broj_clanova_domacinstva || ''}
                  onChange={(e) => handleAiChange('profilisanje', 'broj_clanova_domacinstva', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="npr. 4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={aiKarakteristike.profilisanje?.rad_od_kuce || false}
                    onChange={(e) => handleAiChange('profilisanje', 'rad_od_kuce', e.target.checked)}
                    className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    <Wifi className="w-4 h-4 inline mr-1" />
                    Radi od kuće
                  </span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={aiKarakteristike.profilisanje?.kucni_ljubimci || false}
                    onChange={(e) => handleAiChange('profilisanje', 'kucni_ljubimci', e.target.checked)}
                    className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    <PawPrint className="w-4 h-4 inline mr-1" />
                    Ima kućne ljubimce
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Posebni zahtevi</label>
                <textarea
                  value={aiKarakteristike.profilisanje?.posebni_zahtevi || ''}
                  onChange={(e) => handleAiChange('profilisanje', 'posebni_zahtevi', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="npr. blizina škole, parka, javnog prevoza..."
                />
              </div>
            </div>

            {/* Must-have i Primarni motiv */}
            <div className="bg-white rounded-xl p-4 space-y-4">
              <h5 className="font-medium text-gray-800 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" />
                Must-have karakteristike
              </h5>

              <div className="flex flex-wrap gap-2">
                {mustHaveOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMustHaveToggle(option.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      (aiKarakteristike.must_have || []).includes(option.value)
                        ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Primarni motiv kupovine</label>
                <input
                  type="text"
                  value={aiKarakteristike.primarni_motiv || ''}
                  onChange={(e) => setAiKarakteristike(prev => ({ ...prev, primarni_motiv: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="npr. Porodični život, blizina škole"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Dodatna napomena za AI</label>
                <textarea
                  value={aiKarakteristike.napomena || ''}
                  onChange={(e) => setAiKarakteristike(prev => ({ ...prev, napomena: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Bilo koja dodatna informacija koja može pomoći AI-ju..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Čuvam...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {poziv ? 'Sačuvaj izmene' : 'Dodaj poziv'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
