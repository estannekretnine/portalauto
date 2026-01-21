import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { X, Phone, Save, Loader2, Home, User, MessageSquare, CheckCircle, UserPlus, Users, MapPin, Euro, Ruler, Building2, Brain, Tv } from 'lucide-react'
import { getCurrentUser } from '../utils/auth'

export default function PonudaDetaljiForm({ ponuda, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [searchingKupac, setSearchingKupac] = useState(false)
  const [kupacStatus, setKupacStatus] = useState(null) // 'novi' | 'stari' | null
  const [existingTraznja, setExistingTraznja] = useState(null)
  const [mediji, setMediji] = useState([])
  const [loadingMediji, setLoadingMediji] = useState(false)
  
  // Podaci o kupcu
  const [kupacData, setKupacData] = useState({
    kontakttelefon: '',
    kontaktosoba: '',
    idmedij: ''
  })
  
  // Podaci za poziv
  const [pozivData, setPozivData] = useState({
    komentar: '',
    stspoziv: ''
  })

  // AI Karakteristike - struktura kao u TraznjaForm
  const [aiKarakteristike, setAiKarakteristike] = useState({
    opremljenost: {
      sts_internet: false, sts_kablovska: false, sts_frizider: false, sts_sporet: false,
      sts_vesmasina: false, sts_tv: false, klima: false, sudomasina: false,
      sts_masina_sudje: false, sts_mikrotalasna: false, sts_pegla: false,
      sts_usisivac: false, sts_fen: false, sts_grejalica: false,
      sts_roletne: false, sts_alarm: false, sts_video_nadzor: false, sts_smart_home: false
    },
    zivotni_stil: {
      rad_od_kuce: false, pet_friendly: 0, nivo_buke: '', osuncanost: '',
      blizina_parka: 0, blizina_teretane: 0, blizina_prodavnice: 0,
      blizina_apoteke: 0, blizina_bolnice: 0, blizina_autobuske: 0,
      pusenje_dozvoljeno: false, pogodan_za_decu: false,
      pogodan_za_studente: false, pogodan_za_penzionere: false
    },
    ekologija: {
      pogled: [], indeks_vazduha: '', energetski_razred: '',
      solarni_paneli: false, toplotna_pumpa: false,
      reciklaza: false, zelena_povrsina: 0
    },
    mikrolokacija: {
      mirna_ulica: false, skola_minuta: 0, ev_punjac_metara: 0,
      vrtic_minuta: 0, fakultet_minuta: 0, metro_minuta: 0,
      parking_zona: '', blizina_centra: 0
    },
    bezbednost: {
      portir: false, video_interfon: false, protivpozarni_sistem: false,
      osigurana_zgrada: false, sigurnosna_vrata: false
    },
    prioriteti: {
      prioritet_cena: '', prioritet_lokacija: '', prioritet_opremljenost: '',
      prioritet_kvadratura: '', prioritet_sprat: ''
    }
  })

  // Učitaj medije
  useEffect(() => {
    loadMediji()
  }, [])

  const loadMediji = async () => {
    setLoadingMediji(true)
    try {
      const { data, error } = await supabase
        .from('mediji')
        .select('id, opis')
        .or('stsarhiva.is.null,stsarhiva.eq.false')
        .order('opis', { ascending: true })

      if (error) throw error
      setMediji(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju medija:', error)
    } finally {
      setLoadingMediji(false)
    }
  }

  // Pretraga kupca po telefonu
  const searchKupac = async () => {
    if (!kupacData.kontakttelefon || kupacData.kontakttelefon.length < 6) {
      return
    }

    setSearchingKupac(true)
    try {
      const { data, error } = await supabase
        .from('traznja')
        .select('*')
        .eq('kontakttelefon', kupacData.kontakttelefon)
        .eq('stsaktivan', true)
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setKupacStatus('stari')
        setExistingTraznja(data)
        setKupacData(prev => ({
          ...prev,
          kontaktosoba: data.kontaktosoba || prev.kontaktosoba
        }))
        setPozivData(prev => ({ ...prev, stspoziv: 'starikupac' }))
      } else {
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

  // Handleri za AI karakteristike
  const handleAiOpremljenostChange = (key, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      opremljenost: { ...prev.opremljenost, [key]: value }
    }))
  }

  const handleAiZivotniStilChange = (key, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      zivotni_stil: { ...prev.zivotni_stil, [key]: value }
    }))
  }

  const handleAiEkologijaChange = (key, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      ekologija: { ...prev.ekologija, [key]: value }
    }))
  }

  const handleAiMikrolokacijaChange = (key, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      mikrolokacija: { ...prev.mikrolokacija, [key]: value }
    }))
  }

  const handleAiBezbednostChange = (key, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      bezbednost: { ...prev.bezbednost, [key]: value }
    }))
  }

  const handleAiPrioritetiChange = (key, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      prioriteti: { ...prev.prioriteti, [key]: value }
    }))
  }

  const handlePogledToggle = (value) => {
    setAiKarakteristike(prev => {
      const currentPogled = Array.isArray(prev.ekologija?.pogled) ? prev.ekologija.pogled : []
      const newPogled = currentPogled.includes(value)
        ? currentPogled.filter(v => v !== value)
        : [...currentPogled, value]
      return {
        ...prev,
        ekologija: { ...prev.ekologija, pogled: newPogled }
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

      if (kupacStatus === 'novi') {
        const traznjaData = {
          datumkreiranja: new Date().toISOString(),
          kontaktosoba: kupacData.kontaktosoba || null,
          kontakttelefon: kupacData.kontakttelefon,
          cenado: ponuda.cena || null,
          strukturado: ponuda.struktura || null,
          kvadraturado: ponuda.kvadratura || null,
          stskupaczakupac: ponuda.stsrentaprodaja === 'renta' ? 'zakupac' : 'kupac',
          iddrzava: ponuda.iddrzava || null,
          idgrada: ponuda.idgrada || null,
          idopstina: ponuda.idopstina || null,
          idlokacija: ponuda.idlokacija || null,
          idulica: ponuda.idulica || null,
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

      const pozivDataToSave = {
        datumkreiranja: new Date().toISOString(),
        idponude: ponuda.id,
        idtraznja: traznjaId,
        stspoziv: pozivData.stspoziv || (kupacStatus === 'novi' ? 'novikupac' : 'starikupac'),
        komentar: pozivData.komentar || null,
        ai_karakteristike: aiKarakteristike,
        iduser: currentUser?.id || null,
        idmedij: kupacData.idmedij ? parseInt(kupacData.idmedij) : null,
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

  const isRenta = ponuda.stsrentaprodaja === 'renta'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden">
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

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(100vh-200px)]">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
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

            {/* Medij - Iz kog ste medija saznali za nas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tv className="w-4 h-4 inline mr-1 text-purple-500" />
                Iz kog ste medija saznali za nas?
              </label>
              <div className="relative">
                <Tv className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={kupacData.idmedij}
                  onChange={(e) => handleKupacChange('idmedij', e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  disabled={loadingMediji}
                >
                  <option value="">-- Izaberite medij --</option>
                  {mediji.map(medij => (
                    <option key={medij.id} value={medij.id}>
                      {medij.opis}
                    </option>
                  ))}
                </select>
                {loadingMediji && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                )}
              </div>
            </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opremljenost - samo za rentu */}
                {isRenta && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200">
                    <h5 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                      <span>🏠</span> Opremljenost
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'sts_internet', icon: '🌐', label: 'Internet' },
                        { key: 'sts_kablovska', icon: '📺', label: 'Kablovska' },
                        { key: 'sts_frizider', icon: '❄️', label: 'Frižider' },
                        { key: 'sts_sporet', icon: '🍳', label: 'Šporet' },
                        { key: 'sts_vesmasina', icon: '🧺', label: 'Veš mašina' },
                        { key: 'sts_tv', icon: '📺', label: 'TV' },
                        { key: 'klima', icon: '❄️', label: 'Klima' },
                        { key: 'sudomasina', icon: '🍽️', label: 'Sudomašina' },
                        { key: 'sts_mikrotalasna', icon: '📡', label: 'Mikrotalasna' },
                        { key: 'sts_alarm', icon: '🚨', label: 'Alarm' },
                        { key: 'sts_video_nadzor', icon: '📹', label: 'Video nadzor' },
                        { key: 'sts_smart_home', icon: '🏠', label: 'Smart home' }
                      ].map(item => (
                        <label key={item.key} className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 rounded-lg px-2 py-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={aiKarakteristike.opremljenost?.[item.key] || false}
                            onChange={(e) => handleAiOpremljenostChange(item.key, e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5"
                          />
                          <span>{item.icon}</span>
                          <span className="text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Životni stil */}
                <div className="bg-gradient-to-br from-green-50 to-lime-50 rounded-xl p-4 border border-green-200">
                  <h5 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <span>🌿</span> Životni stil
                  </h5>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <label className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 rounded-lg px-2 py-1.5 cursor-pointer">
                      <input type="checkbox" checked={aiKarakteristike.zivotni_stil?.rad_od_kuce || false} onChange={(e) => handleAiZivotniStilChange('rad_od_kuce', e.target.checked)} className="rounded border-gray-300 text-green-600 w-3.5 h-3.5" />
                      <span>💻</span><span className="text-gray-700">Rad od kuće</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 rounded-lg px-2 py-1.5 cursor-pointer">
                      <input type="checkbox" checked={aiKarakteristike.zivotni_stil?.pusenje_dozvoljeno || false} onChange={(e) => handleAiZivotniStilChange('pusenje_dozvoljeno', e.target.checked)} className="rounded border-gray-300 text-green-600 w-3.5 h-3.5" />
                      <span>🚬</span><span className="text-gray-700">Pušenje OK</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 rounded-lg px-2 py-1.5 cursor-pointer">
                      <input type="checkbox" checked={aiKarakteristike.zivotni_stil?.pogodan_za_decu || false} onChange={(e) => handleAiZivotniStilChange('pogodan_za_decu', e.target.checked)} className="rounded border-gray-300 text-green-600 w-3.5 h-3.5" />
                      <span>👶</span><span className="text-gray-700">Za decu</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 rounded-lg px-2 py-1.5 cursor-pointer">
                      <input type="checkbox" checked={aiKarakteristike.zivotni_stil?.pogodan_za_studente || false} onChange={(e) => handleAiZivotniStilChange('pogodan_za_studente', e.target.checked)} className="rounded border-gray-300 text-green-600 w-3.5 h-3.5" />
                      <span>🎓</span><span className="text-gray-700">Za studente</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 rounded-lg px-2 py-1.5 cursor-pointer">
                      <input type="checkbox" checked={aiKarakteristike.zivotni_stil?.pogodan_za_penzionere || false} onChange={(e) => handleAiZivotniStilChange('pogodan_za_penzionere', e.target.checked)} className="rounded border-gray-300 text-green-600 w-3.5 h-3.5" />
                      <span>👴</span><span className="text-gray-700">Za penzionere</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">🐾 Pet-friendly</label>
                      <input type="number" min="0" max="5" value={aiKarakteristike.zivotni_stil?.pet_friendly || 0} onChange={(e) => handleAiZivotniStilChange('pet_friendly', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white" placeholder="0-5" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">🔊 Buka</label>
                      <select value={aiKarakteristike.zivotni_stil?.nivo_buke || ''} onChange={(e) => handleAiZivotniStilChange('nivo_buke', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white">
                        <option value="">-</option>
                        <option value="tiho">🤫 Tiho</option>
                        <option value="umereno">🔉 Umereno</option>
                        <option value="bucno">🔊 Bučno</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">☀️ Osunčanost</label>
                      <select value={aiKarakteristike.zivotni_stil?.osuncanost || ''} onChange={(e) => handleAiZivotniStilChange('osuncanost', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white">
                        <option value="">-</option>
                        <option value="jug">🌞 Jug</option>
                        <option value="istok">🌅 Istok</option>
                        <option value="zapad">🌇 Zapad</option>
                        <option value="sever">❄️ Sever</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Ekologija */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
                  <h5 className="font-semibold text-teal-800 mb-3 flex items-center gap-2">
                    <span>🌍</span> Ekologija i pogled
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">👁️ Pogled</label>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { value: 'park', label: '🌳 Park' },
                          { value: 'reka', label: '🌊 Reka' },
                          { value: 'grad', label: '🏙️ Grad' },
                          { value: 'dvoriste', label: '🏡 Dvorište' },
                          { value: 'ulica', label: '🛣️ Ulica' },
                          { value: 'panorama', label: '🌄 Panorama' }
                        ].map(option => {
                          const currentPogled = Array.isArray(aiKarakteristike.ekologija?.pogled) ? aiKarakteristike.ekologija.pogled : []
                          const isChecked = currentPogled.includes(option.value)
                          return (
                            <label key={option.value} className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${isChecked ? 'bg-teal-600 text-white' : 'bg-white hover:bg-slate-100 text-gray-700'}`}>
                              <input type="checkbox" checked={isChecked} onChange={() => handlePogledToggle(option.value)} className="hidden" />
                              {option.label}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">💨 Kvalitet vazduha</label>
                        <select value={aiKarakteristike.ekologija?.indeks_vazduha || ''} onChange={(e) => handleAiEkologijaChange('indeks_vazduha', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white">
                          <option value="">-</option>
                          <option value="dobar">✅ Dobar</option>
                          <option value="srednji">⚠️ Srednji</option>
                          <option value="los">❌ Loš</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">⚡ Energetski razred</label>
                        <select value={aiKarakteristike.ekologija?.energetski_razred || ''} onChange={(e) => handleAiEkologijaChange('energetski_razred', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white">
                          <option value="">-</option>
                          <option value="A+">A+</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'solarni_paneli', label: '☀️ Solarni paneli' },
                        { key: 'toplotna_pumpa', label: '🌡️ Toplotna pumpa' },
                        { key: 'reciklaza', label: '♻️ Reciklaža' }
                      ].map(item => (
                        <label key={item.key} className="flex items-center gap-1 text-xs bg-white hover:bg-slate-100 rounded-lg px-2 py-1.5 cursor-pointer">
                          <input type="checkbox" checked={aiKarakteristike.ekologija?.[item.key] || false} onChange={(e) => handleAiEkologijaChange(item.key, e.target.checked)} className="rounded border-gray-300 text-teal-600 w-3 h-3" />
                          <span className="text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bezbednost */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
                  <h5 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <span>🛡️</span> Bezbednost
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'portir', icon: '👮', label: 'Portir' },
                      { key: 'video_interfon', icon: '📹', label: 'Video interfon' },
                      { key: 'protivpozarni_sistem', icon: '🧯', label: 'Protivpožarni' },
                      { key: 'osigurana_zgrada', icon: '🏢', label: 'Osigurana zgrada' },
                      { key: 'sigurnosna_vrata', icon: '🚪', label: 'Sigurnosna vrata' }
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 rounded-lg px-3 py-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiKarakteristike.bezbednost?.[item.key] || false}
                          onChange={(e) => handleAiBezbednostChange(item.key, e.target.checked)}
                          className="rounded border-gray-300 text-red-600 w-3.5 h-3.5"
                        />
                        <span>{item.icon}</span>
                        <span className="text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mikrolokacija */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                  <h5 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <span>📍</span> Mikrolokacija
                  </h5>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs bg-white hover:bg-slate-100 rounded-lg px-3 py-2 cursor-pointer">
                      <input type="checkbox" checked={aiKarakteristike.mikrolokacija?.mirna_ulica || false} onChange={(e) => handleAiMikrolokacijaChange('mirna_ulica', e.target.checked)} className="rounded border-gray-300 text-amber-600 w-3.5 h-3.5" />
                      <span>🤫</span><span className="text-gray-700">Mirna ulica</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">🏫 Škola (min)</label>
                        <input type="number" min="0" value={aiKarakteristike.mikrolokacija?.skola_minuta || 0} onChange={(e) => handleAiMikrolokacijaChange('skola_minuta', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">👶 Vrtić (min)</label>
                        <input type="number" min="0" value={aiKarakteristike.mikrolokacija?.vrtic_minuta || 0} onChange={(e) => handleAiMikrolokacijaChange('vrtic_minuta', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">🎓 Fakultet (min)</label>
                        <input type="number" min="0" value={aiKarakteristike.mikrolokacija?.fakultet_minuta || 0} onChange={(e) => handleAiMikrolokacijaChange('fakultet_minuta', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">🏙️ Centar (min)</label>
                        <input type="number" min="0" value={aiKarakteristike.mikrolokacija?.blizina_centra || 0} onChange={(e) => handleAiMikrolokacijaChange('blizina_centra', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">🅿️ Parking zona</label>
                      <select value={aiKarakteristike.mikrolokacija?.parking_zona || ''} onChange={(e) => handleAiMikrolokacijaChange('parking_zona', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white">
                        <option value="">-</option>
                        <option value="besplatna">✅ Besplatna</option>
                        <option value="zona1">🔴 Zona 1</option>
                        <option value="zona2">🟡 Zona 2</option>
                        <option value="zona3">🟢 Zona 3</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Prioriteti */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200 md:col-span-2">
                  <h5 className="font-semibold text-violet-800 mb-3 flex items-center gap-2">
                    <span>⭐</span> Prioriteti kupca
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { key: 'prioritet_cena', label: '💰 Cena' },
                      { key: 'prioritet_lokacija', label: '📍 Lokacija' },
                      { key: 'prioritet_opremljenost', label: '🏠 Opremljenost' },
                      { key: 'prioritet_kvadratura', label: '📐 Kvadratura' },
                      { key: 'prioritet_sprat', label: '🏢 Sprat' }
                    ].map(item => (
                      <div key={item.key}>
                        <label className="block text-xs text-gray-600 mb-1">{item.label}</label>
                        <select
                          value={aiKarakteristike.prioriteti?.[item.key] || ''}
                          onChange={(e) => handleAiPrioritetiChange(item.key, e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                        >
                          <option value="">-</option>
                          <option value="nizak">Nizak</option>
                          <option value="srednji">Srednji</option>
                          <option value="visok">Visok</option>
                          <option value="kriticno">Kritično</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Footer - izvan scroll kontejnera */}
          <div className="flex items-center justify-between p-6 pt-4 border-t border-gray-100 bg-white">
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
