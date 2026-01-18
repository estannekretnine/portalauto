import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { X, Phone, Save, Loader2, Home, User, MessageSquare, Search, CheckCircle, UserPlus, Users, MapPin, Euro, Ruler, Building2, Brain, Target, Ban, Heart, Car, PawPrint, Wifi, Sparkles } from 'lucide-react'
import { getCurrentUser } from '../utils/auth'

export default function PonudaDetaljiForm({ ponuda, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [searchingKupac, setSearchingKupac] = useState(false)
  const [kupacStatus, setKupacStatus] = useState(null) // 'novi' | 'stari' | null
  const [existingTraznja, setExistingTraznja] = useState(null)
  
  // Podaci o kupcu
  const [kupacData, setKupacData] = useState({
    kontakttelefon: '',
    kontaktosoba: ''
  })
  
  // Podaci za poziv
  const [pozivData, setPozivData] = useState({
    komentar: '',
    stspoziv: '' // automatski se postavlja na osnovu pretrage
  })

  // AI Karakteristike
  const [aiKarakteristike, setAiKarakteristike] = useState({
    motivacija: {
      sta_privuklo: '',
      cilj_kupovine: '',
      koliko_dugo_trazi: ''
    },
    fleksibilnost: {
      lokacija_fiksna: false,
      susedne_opstine: false,
      geografski_radijus: '',
      budzet_idealan: '',
      budzet_max: '',
      prioritet_struktura_ili_kvadratura: ''
    },
    dealbreakeri: {
      ne_dolazi_u_obzir: [],
      parking_neophodan: false,
      garaza_neophodna: false,
      nacin_finansiranja: ''
    },
    profilisanje: {
      broj_clanova_domacinstva: '',
      rad_od_kuce: false,
      kucni_ljubimci: false,
      posebni_zahtevi: ''
    },
    primarni_motiv: '',
    must_have: [],
    napomena: ''
  })

  // Opcije
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

  // Pretraga kupca po telefonu
  const searchKupac = async () => {
    if (!kupacData.kontakttelefon || kupacData.kontakttelefon.length < 6) {
      return
    }

    setSearchingKupac(true)
    try {
      // Pretraži u tabeli traznja po telefonu
      const { data, error } = await supabase
        .from('traznja')
        .select('*')
        .eq('kontakttelefon', kupacData.kontakttelefon)
        .eq('stsaktivan', true)
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        // Kupac postoji - stari kupac
        setKupacStatus('stari')
        setExistingTraznja(data)
        setKupacData(prev => ({
          ...prev,
          kontaktosoba: data.kontaktosoba || prev.kontaktosoba
        }))
        setPozivData(prev => ({ ...prev, stspoziv: 'starikupac' }))
      } else {
        // Kupac ne postoji - novi kupac
        setKupacStatus('novi')
        setExistingTraznja(null)
        setPozivData(prev => ({ ...prev, stspoziv: 'novikupac' }))
      }
    } catch (error) {
      console.error('Greška pri pretrazi kupca:', error)
      setKupacStatus(null)
      setExistingTraznja(null)
    } finally {
      setSearchingKupac(false)
    }
  }

  // Debounce pretraga
  useEffect(() => {
    const timer = setTimeout(() => {
      if (kupacData.kontakttelefon && kupacData.kontakttelefon.length >= 6) {
        searchKupac()
      } else {
        setKupacStatus(null)
        setExistingTraznja(null)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [kupacData.kontakttelefon])

  const handleKupacChange = (field, value) => {
    setKupacData(prev => ({ ...prev, [field]: value }))
  }

  const handlePozivChange = (field, value) => {
    setPozivData(prev => ({ ...prev, [field]: value }))
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
    
    if (!kupacData.kontakttelefon) {
      alert('Molimo unesite kontakt telefon kupca')
      return
    }

    if (!kupacStatus) {
      alert('Molimo sačekajte da se završi pretraga kupca')
      return
    }

    setLoading(true)

    try {
      const currentUser = getCurrentUser()
      let traznjaId = existingTraznja?.id || null

      // Ako je novi kupac, kreiraj traznju
      if (kupacStatus === 'novi') {
        const traznjaData = {
          datumkreiranja: new Date().toISOString(),
          kontaktosoba: kupacData.kontaktosoba || null,
          kontakttelefon: kupacData.kontakttelefon,
          // Povuci vrednosti iz ponude
          cenado: ponuda.cena || null,
          strukturado: ponuda.struktura || null,
          kvadraturado: ponuda.kvadratura || null,
          // Postavi stskupaczakupac na osnovu tipa oglasa
          stskupaczakupac: ponuda.stsrentaprodaja === 'renta' ? 'zakupac' : 'kupac',
          // Lokalitet iz ponude
          iddrzava: ponuda.iddrzava || null,
          idgrada: ponuda.idgrada || null,
          idopstina: ponuda.idopstina || null,
          idlokacija: ponuda.idlokacija || null,
          idulica: ponuda.idulica || null,
          // AI karakteristike
          ai_karakteristike: aiKarakteristike,
          stsaktivan: true,
          iduser: currentUser?.id || null,
          statuskupca: 'novi'
        }

        const { data: newTraznja, error: traznjaError } = await supabase
          .from('traznja')
          .insert([traznjaData])
          .select()
          .single()

        if (traznjaError) throw traznjaError
        traznjaId = newTraznja.id
      }

      // Kreiraj poziv
      const pozivDataToSave = {
        datumkreiranja: new Date().toISOString(),
        idponude: ponuda.id,
        idtraznja: traznjaId,
        stspoziv: pozivData.stspoziv || (kupacStatus === 'novi' ? 'novikupac' : 'starikupac'),
        komentar: pozivData.komentar || null,
        ai_karakteristike: aiKarakteristike,
        iduser: currentUser?.id || null,
        arhiviran: false
      }

      const { error: pozivError } = await supabase
        .from('pozivi')
        .insert([pozivDataToSave])

      if (pozivError) throw pozivError

      onSuccess()
    } catch (error) {
      console.error('Greška pri čuvanju:', error)
      alert('Greška pri čuvanju: ' + error.message)
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Detalji poziva</h3>
              <p className="text-gray-400 text-xs">Registruj poziv za oglas #{ponuda.id}</p>
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
          {/* Info o ponudi - Read Only */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-4">
              <Home className="w-4 h-4 text-amber-500" />
              Podaci o nekretnini
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-3 border border-amber-100">
                <div className="text-xs text-gray-500 mb-1">ID Ponude</div>
                <div className="font-bold text-gray-900">#{ponuda.id}</div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-amber-100">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Vrsta
                </div>
                <div className="font-semibold text-gray-900">{ponuda.vrstaobjekta?.opis || '-'}</div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-amber-100">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Lokacija
                </div>
                <div className="font-semibold text-gray-900">{ponuda.lokacija?.opis || ponuda.opstina?.opis || '-'}</div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-amber-100">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Ruler className="w-3 h-3" /> Kvadratura
                </div>
                <div className="font-semibold text-gray-900">{ponuda.kvadratura ? `${ponuda.kvadratura} m²` : '-'}</div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-amber-100">
                <div className="text-xs text-gray-500 mb-1">Struktura</div>
                <div className="font-semibold text-gray-900">{ponuda.struktura ? parseFloat(ponuda.struktura).toFixed(1) : '-'}</div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-amber-100">
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Euro className="w-3 h-3" /> Cena
                </div>
                <div className="font-bold text-amber-600">{ponuda.cena ? new Intl.NumberFormat('sr-RS').format(ponuda.cena) + ' €' : '-'}</div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-amber-100 col-span-2">
                <div className="text-xs text-gray-500 mb-1">Tip</div>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                  ponuda.stsrentaprodaja === 'prodaja'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {ponuda.stsrentaprodaja === 'prodaja' ? '🏠 Prodaja' : '🔑 Izdavanje'}
                </span>
              </div>
            </div>
          </div>

          {/* Podaci o kupcu */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              Podaci o kupcu
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kontakt telefon sa pretragom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kontakt telefon *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={kupacData.kontakttelefon}
                    onChange={(e) => handleKupacChange('kontakttelefon', e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Unesite broj telefona..."
                    required
                  />
                  {searchingKupac && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {!searchingKupac && kupacStatus === 'stari' && (
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                  )}
                  {!searchingKupac && kupacStatus === 'novi' && (
                    <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Kontakt osoba */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kontakt osoba
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={kupacData.kontaktosoba}
                    onChange={(e) => handleKupacChange('kontaktosoba', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ime i prezime kupca..."
                  />
                </div>
              </div>
            </div>

            {/* Status kupca */}
            {kupacStatus && (
              <div className={`p-4 rounded-xl border ${
                kupacStatus === 'stari' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-3">
                  {kupacStatus === 'stari' ? (
                    <>
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">Stari kupac</p>
                        <p className="text-sm text-blue-700">
                          Kupac već postoji u bazi (Tražnja #{existingTraznja?.id})
                          {existingTraznja?.kontaktosoba && ` - ${existingTraznja.kontaktosoba}`}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-900">Novi kupac</p>
                        <p className="text-sm text-emerald-700">
                          Kupac ne postoji u bazi - biće kreirana nova tražnja
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Komentar */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1 text-gray-500" />
              Komentar o pozivu
            </label>
            <textarea
              value={pozivData.komentar}
              onChange={(e) => handlePozivChange('komentar', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Unesite komentar o pozivu..."
            />
          </div>

          {/* AI Karakteristike - prikaži samo za novog kupca */}
          {kupacStatus === 'novi' && (
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
                  Motivacija
                </h5>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Šta vam je privuklo pažnju kod ovog oglasa?</label>
                  <input
                    type="text"
                    value={aiKarakteristike.motivacija?.sta_privuklo || ''}
                    onChange={(e) => handleAiChange('motivacija', 'sta_privuklo', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="npr. terasa, lokacija, moderan dizajn..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Da li tražite za život ili investiciju?</label>
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
                  <label className="block text-sm text-gray-600 mb-2">Koliko dugo već tražite?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'do_mesec', label: 'Do mesec' },
                      { value: '1_3_meseca', label: '1-3 meseca' },
                      { value: '3_6_meseci', label: '3-6 meseci' },
                      { value: 'preko_6_meseci', label: '6+ meseci' }
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

              {/* 2. Dealbreakeri */}
              <div className="bg-white rounded-xl p-4 space-y-4">
                <h5 className="font-medium text-gray-800 flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-500" />
                  Dealbreakeri
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
                      { value: 'prodaja_nekretnine', label: '🏠 Prodaja' },
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

              {/* 3. Profilisanje */}
              <div className="bg-white rounded-xl p-4 space-y-4">
                <h5 className="font-medium text-gray-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Profilisanje
                </h5>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Broj članova domaćinstva</label>
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
                      Kućni ljubimci
                    </span>
                  </label>
                </div>
              </div>

              {/* 4. Must-have */}
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
                  <label className="block text-sm text-gray-600 mb-2">Dodatna napomena</label>
                  <textarea
                    value={aiKarakteristike.napomena || ''}
                    onChange={(e) => setAiKarakteristike(prev => ({ ...prev, napomena: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Bilo koja dodatna informacija..."
                  />
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || !kupacStatus || !kupacData.kontakttelefon}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Čuvam...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Registruj poziv
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
