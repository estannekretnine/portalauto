import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabase'
import { getCurrentUser } from '../utils/auth'
import { Save, X, Building2, MapPin, DollarSign, Ruler, Info, Search, ChevronDown, Users, FileText, Receipt, UserCheck, Brain, Plus, Trash2, Phone, Calendar, Home, Euro } from 'lucide-react'

export default function TraznjaForm({ traznja, onClose, onSuccess }) {
  const currentUser = getCurrentUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEditing = !!traznja

  // State za duplikate telefona
  const [duplicatePhone, setDuplicatePhone] = useState(null)
  const [checkingPhone, setCheckingPhone] = useState(false)

  // Osnovne informacije
  const [formData, setFormData] = useState({
    kontaktosoba: '',
    kontakttelefon: '',
    strukturaod: '',
    strukturado: '',
    kvadraturaod: '',
    kvadraturado: '',
    cenaod: '',
    cenado: '',
    detaljitraznje: '',
    iddrzava: '',
    idgrada: '',
    idopstina: '',
    idlokacija: '',
    idulica: '',
    stsaktivan: true,
    stskupaczakupac: 'kupac',
    statuskupca: '',
    // Nova polja za sprat
    spratod: '',
    spratdo: '',
    stsnecezadnjispratat: false,
    stsnecesuteren: false,
    iduser: currentUser?.id || null
  })

  // Aktivni tab za metapodatke
  const [activeMetaTab, setActiveMetaTab] = useState('nalogodavci')

  // State za otvorene sekcije
  const [openSections, setOpenSections] = useState({
    osnovne: true,
    lokacija: true,
    ai: true,
    metapodaci: true
  })

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // JSONB metapodaci
  const [metapodaci, setMetapodaci] = useState({
    nalogodavci: [{
      ime: '', prezime: '', adresa: '', matbrojjmbg: '', email: '', brojtel: '',
      identisprava: '', lk: '', pib: '', iddrzava: '', stslice: '',
      porekloimovine: '', sumnjapranjenovca: false, mestorodjenja: '',
      datumrodjenja: '', stsrezident: false, stvarnivlasnikstranke: false,
      datumzadnjeprovere: '', finalnakategorizacija: ''
    }],
    eop: {
      stsugovorpotpisan: false, datumugovora: '', datumistice: '',
      katastarskaparcela: '', katopstina: ''
    },
    realizacija: {
      vrstaobjekta: '', opstinanekretnisti: '', adresanekretnosti: '',
      povrsina: '', zakljucen: false, datumzakljucenja: '',
      kupoprodajnacena: 0, provizija: 0, primedba: '', namenatransakcije: ''
    },
    zastupnik: {
      ime: '', prezime: '', adresa: '', opstina: '', brojlicnekarte: '',
      datum: '', mestoizdavanja: ''
    }
  })

  // JSONB ai_karakteristike - usklađeno sa PonudaForm
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
      prioritet_kvadratura: '', prioritet_struktura: '', prioritet_sprat: '',
      prioritet_bezbednost: ''
    },
    fleksibilnost: {
      fleksibilnost_cena: 0, fleksibilnost_kvadratura: 0, fleksibilnost_struktura: 0,
      fleksibilnost_sprat: 0, fleksibilnost_lokacija: 0
    },
    zivotne_karakteristike: {
      ima_autoparking: false, koristi_javni_prevoz: false, ima_kucne_ljubimce: '',
      broj_ukucana: 1, tip_domacinstva: '', radno_vreme_fleksibilno: false,
      radi_od_kuce_moguce: false
    }
  })

  // Lookup podaci
  const [drzave, setDrzave] = useState([])
  const [gradovi, setGradovi] = useState([])
  const [opstine, setOpstine] = useState([])
  const [lokacije, setLokacije] = useState([])
  const [ulice, setUlice] = useState([])

  // Autocomplete za ulice
  const [ulicaSearchTerm, setUlicaSearchTerm] = useState('')
  const [filteredUlice, setFilteredUlice] = useState([])
  const [showUlicaDropdown, setShowUlicaDropdown] = useState(false)
  const [sveUliceSaRelacijama, setSveUliceSaRelacijama] = useState([])
  const isSelectingUlicaRef = useRef(false)

  useEffect(() => {
    loadLookupData()
    loadSveUliceSaRelacijama()
  }, [])

  useEffect(() => {
    if (traznja) {
      loadTraznjaData(traznja.id)
    }
  }, [traznja])

  // Učitaj podatke tražnje za uređivanje
  const loadTraznjaData = async (traznjaId) => {
    try {
      setLoading(true)
      
      const { data: traznjaData, error: traznjaError } = await supabase
        .from('traznja')
        .select('*')
        .eq('id', traznjaId)
        .single()
      
      if (traznjaError) throw traznjaError
      
      setFormData(prev => ({
        ...prev,
        kontaktosoba: traznjaData.kontaktosoba || '',
        kontakttelefon: traznjaData.kontakttelefon || '',
        strukturaod: traznjaData.strukturaod || '',
        strukturado: traznjaData.strukturado || '',
        kvadraturaod: traznjaData.kvadraturaod || '',
        kvadraturado: traznjaData.kvadraturado || '',
        cenaod: traznjaData.cenaod || '',
        cenado: traznjaData.cenado || '',
        detaljitraznje: traznjaData.detaljitraznje || '',
        iddrzava: traznjaData.iddrzava || '',
        idgrada: traznjaData.idgrada || '',
        idopstina: traznjaData.idopstina || '',
        idlokacija: traznjaData.idlokacija || '',
        idulica: traznjaData.idulica || '',
        stsaktivan: traznjaData.stsaktivan ?? true,
        stskupaczakupac: traznjaData.stskupaczakupac || 'kupac',
        statuskupca: traznjaData.statuskupca || '',
        // Nova polja za sprat
        spratod: traznjaData.spratod || '',
        spratdo: traznjaData.spratdo || '',
        stsnecezadnjispratat: traznjaData.stsnecezadnjispratat || false,
        stsnecesuteren: traznjaData.stsnecesuteren || false,
        iduser: traznjaData.iduser || currentUser?.id || null
      }))

      if (traznjaData.metapodaci) {
        setMetapodaci(prev => ({ ...prev, ...traznjaData.metapodaci }))
      }
      if (traznjaData.ai_karakteristike) {
        setAiKarakteristike(prev => ({ ...prev, ...traznjaData.ai_karakteristike }))
      }
    } catch (error) {
      console.error('Greška pri učitavanju tražnje:', error)
      setError('Greška pri učitavanju podataka tražnje')
    } finally {
      setLoading(false)
    }
  }

  // Zatvori dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-ulica-autocomplete]')) {
        setShowUlicaDropdown(false)
      }
    }
    
    if (showUlicaDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUlicaDropdown])
  
  useEffect(() => {
    if (ulicaSearchTerm.trim() === '') {
      setFilteredUlice([])
      setShowUlicaDropdown(false)
      return
    }
    
    const filtered = sveUliceSaRelacijama.filter(ulica => 
      ulica.opis.toLowerCase().includes(ulicaSearchTerm.toLowerCase()) ||
      ulica.lokacija?.opis?.toLowerCase().includes(ulicaSearchTerm.toLowerCase()) ||
      ulica.opstina?.opis?.toLowerCase().includes(ulicaSearchTerm.toLowerCase()) ||
      ulica.grad?.opis?.toLowerCase().includes(ulicaSearchTerm.toLowerCase())
    )
    
    setFilteredUlice(filtered.slice(0, 10))
    setShowUlicaDropdown(filtered.length > 0)
  }, [ulicaSearchTerm, sveUliceSaRelacijama])

  useEffect(() => {
    if (isSelectingUlicaRef.current) return
    
    if (formData.iddrzava) {
      setFormData(prev => ({ ...prev, idgrada: '', idopstina: '', idlokacija: '', idulica: '' }))
      loadGradovi(parseInt(formData.iddrzava))
    } else {
      setGradovi([])
      setOpstine([])
      setLokacije([])
      setUlice([])
    }
  }, [formData.iddrzava])

  useEffect(() => {
    if (isSelectingUlicaRef.current) return
    
    if (formData.idgrada) {
      loadOpstine(parseInt(formData.idgrada))
      setFormData(prev => ({ ...prev, idopstina: '', idlokacija: '', idulica: '' }))
    } else {
      setOpstine([])
      setLokacije([])
      setUlice([])
    }
  }, [formData.idgrada])

  useEffect(() => {
    if (isSelectingUlicaRef.current) return
    
    if (formData.idopstina) {
      loadLokacije(parseInt(formData.idopstina))
      setFormData(prev => ({ ...prev, idlokacija: '', idulica: '' }))
    } else {
      setLokacije([])
      setUlice([])
    }
  }, [formData.idopstina])

  useEffect(() => {
    if (isSelectingUlicaRef.current) return
    
    if (formData.idlokacija) {
      loadUlice(parseInt(formData.idlokacija))
      setFormData(prev => ({ ...prev, idulica: '' }))
    } else {
      setUlice([])
    }
  }, [formData.idlokacija])

  const loadLookupData = async () => {
    try {
      const { data: drzaveData } = await supabase.from('drzava').select('*').order('opis')
      setDrzave(drzaveData || [])
    } catch (error) {
      console.error('Greška pri učitavanju lookup podataka:', error)
    }
  }

  const loadGradovi = async (iddrzava) => {
    try {
      if (!iddrzava) { setGradovi([]); return }
      const { data } = await supabase.from('grad').select('id, opis, iddrzave').eq('iddrzave', iddrzava).order('opis')
      setGradovi(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju gradova:', error)
      setGradovi([])
    }
  }

  const loadOpstine = async (idgrada) => {
    try {
      if (!idgrada) { setOpstine([]); return }
      const { data } = await supabase.from('opstina').select('*').eq('idgrad', idgrada).order('opis')
      setOpstine(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju opština:', error)
      setOpstine([])
    }
  }

  const loadLokacije = async (idopstina) => {
    try {
      if (!idopstina) { setLokacije([]); return }
      const { data } = await supabase.from('lokacija').select('*').eq('idopstina', idopstina).order('opis')
      setLokacije(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju lokacija:', error)
      setLokacije([])
    }
  }

  const loadUlice = async (idlokacija) => {
    try {
      if (!idlokacija) { setUlice([]); return }
      const { data } = await supabase.from('ulica').select('*').eq('idlokacija', idlokacija).order('opis')
      setUlice(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju ulica:', error)
      setUlice([])
    }
  }

  const loadSveUliceSaRelacijama = async () => {
    try {
      const { data, error } = await supabase
        .from('ulica')
        .select(`
          id, opis, idlokacija,
          lokacija:lokacija!ulica_idlokacija_fkey (
            id, opis, idopstina,
            opstina:opstina!lokacija_idopstina_fkey (
              id, opis, idgrad,
              grad:grad!opstina_idgrad_fkey (
                id, opis, iddrzave,
                drzava:drzava!grad_iddrzave_fkey ( id, opis )
              )
            )
          )
        `)
        .order('opis')
      
      if (error) { setSveUliceSaRelacijama([]); return }
      
      const transformedData = (data || []).map(ulica => {
        const lokacija = ulica.lokacija
        const opstina = lokacija?.opstina
        const grad = opstina?.grad
        const drzava = grad?.drzava
        
        return {
          id: ulica.id, opis: ulica.opis, idlokacija: ulica.idlokacija,
          lokacija: lokacija ? {
            id: lokacija.id, opis: lokacija.opis, idopstina: lokacija.idopstina,
            opstina: opstina ? {
              id: opstina.id, opis: opstina.opis, idgrad: opstina.idgrad,
              grad: grad ? { id: grad.id, opis: grad.opis, iddrzave: grad.iddrzave, drzava } : null
            } : null
          } : null
        }
      })
      
      setSveUliceSaRelacijama(transformedData)
    } catch (error) {
      console.error('Greška pri učitavanju ulica sa relacijama:', error)
      setSveUliceSaRelacijama([])
    }
  }

  const handleUlicaSelect = (ulica) => {
    if (!ulica || !ulica.lokacija) return
    
    const lokacija = ulica.lokacija
    const opstina = lokacija?.opstina
    const grad = opstina?.grad
    const drzava = grad?.drzava
    
    setShowUlicaDropdown(false)
    setUlicaSearchTerm('')
    isSelectingUlicaRef.current = true
    
    setFormData(prev => ({
      ...prev,
      iddrzava: drzava?.id?.toString() || '',
      idgrada: grad?.id?.toString() || '',
      idopstina: opstina?.id?.toString() || '',
      idlokacija: lokacija?.id?.toString() || '',
      idulica: ulica.id.toString()
    }))
    
    if (drzava?.id) loadGradovi(drzava.id)
    if (grad?.id) loadOpstine(grad.id)
    if (opstina?.id) loadLokacije(opstina.id)
    
    setTimeout(() => { isSelectingUlicaRef.current = false }, 200)
  }

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    
    // Provera duplikata telefona pri unosu
    if (key === 'kontakttelefon' && value && value.length >= 6) {
      checkDuplicatePhone(value)
    } else if (key === 'kontakttelefon') {
      setDuplicatePhone(null)
    }
  }

  // Funkcija za proveru duplikata telefona
  const checkDuplicatePhone = async (phone) => {
    if (!phone || phone.length < 6) return
    
    setCheckingPhone(true)
    try {
      // Ukloni razmake i specijalne karaktere za poređenje
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
      
      let query = supabase
        .from('traznja')
        .select('id, kontaktosoba, kontakttelefon, datumkreiranja')
        .ilike('kontakttelefon', `%${cleanPhone}%`)
      
      // Ako uređujemo postojeću tražnju, isključi je iz pretrage
      if (isEditing && traznja?.id) {
        query = query.neq('id', traznja.id)
      }
      
      const { data, error } = await query.limit(5)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        setDuplicatePhone(data)
      } else {
        setDuplicatePhone(null)
      }
    } catch (err) {
      console.error('Greška pri proveri duplikata:', err)
    } finally {
      setCheckingPhone(false)
    }
  }

  // Handleri za Nalogodavce
  const handleNalogodavacChange = (index, field, value) => {
    setMetapodaci(prev => {
      const newNalogodavci = [...prev.nalogodavci]
      newNalogodavci[index] = { ...newNalogodavci[index], [field]: value }
      return { ...prev, nalogodavci: newNalogodavci }
    })
  }

  const addNalogodavac = () => {
    setMetapodaci(prev => ({
      ...prev,
      nalogodavci: [...prev.nalogodavci, {
        ime: '', prezime: '', adresa: '', matbrojjmbg: '', email: '', brojtel: '',
        identisprava: '', lk: '', pib: '', iddrzava: '', stslice: '',
        porekloimovine: '', sumnjapranjenovca: false, mestorodjenja: '',
        datumrodjenja: '', stsrezident: false, stvarnivlasnikstranke: false,
        datumzadnjeprovere: '', finalnakategorizacija: ''
      }]
    }))
  }

  const removeNalogodavac = (index) => {
    if (metapodaci.nalogodavci.length > 1) {
      setMetapodaci(prev => ({
        ...prev,
        nalogodavci: prev.nalogodavci.filter((_, i) => i !== index)
      }))
    }
  }

  const handleEopChange = (field, value) => {
    setMetapodaci(prev => ({ ...prev, eop: { ...prev.eop, [field]: value } }))
  }

  const handleRealizacijaChange = (field, value) => {
    setMetapodaci(prev => ({ ...prev, realizacija: { ...prev.realizacija, [field]: value } }))
  }

  const handleZastupnikChange = (field, value) => {
    setMetapodaci(prev => ({ ...prev, zastupnik: { ...prev.zastupnik, [field]: value } }))
  }

  // AI karakteristike handleri - usklađeno sa PonudaForm
  const handleAiOpremljenostChange = (field, value) => {
    setAiKarakteristike(prev => ({ ...prev, opremljenost: { ...prev.opremljenost, [field]: value } }))
  }

  const handleAiZivotniStilChange = (field, value) => {
    setAiKarakteristike(prev => ({ ...prev, zivotni_stil: { ...prev.zivotni_stil, [field]: value } }))
  }

  const handleAiEkologijaChange = (field, value) => {
    setAiKarakteristike(prev => ({ ...prev, ekologija: { ...prev.ekologija, [field]: value } }))
  }

  const handleAiMikrolokacijaChange = (field, value) => {
    setAiKarakteristike(prev => ({ ...prev, mikrolokacija: { ...prev.mikrolokacija, [field]: value } }))
  }

  const handleAiBezbednostChange = (field, value) => {
    setAiKarakteristike(prev => ({ ...prev, bezbednost: { ...prev.bezbednost, [field]: value } }))
  }

  const handlePogledToggle = (value) => {
    setAiKarakteristike(prev => {
      const currentPogled = Array.isArray(prev.ekologija.pogled) ? prev.ekologija.pogled : []
      const newPogled = currentPogled.includes(value) 
        ? currentPogled.filter(p => p !== value) 
        : [...currentPogled, value]
      return { ...prev, ekologija: { ...prev.ekologija, pogled: newPogled } }
    })
  }

  const handleAiPriorititiChange = (field, value) => {
    setAiKarakteristike(prev => ({ ...prev, prioriteti: { ...prev.prioriteti, [field]: value } }))
  }

  const handleAiFleksibilnostChange = (field, value) => {
    setAiKarakteristike(prev => ({ ...prev, fleksibilnost: { ...prev.fleksibilnost, [field]: value } }))
  }

  const handleAiZivotneKarakteristikeChange = (field, value) => {
    setAiKarakteristike(prev => ({ ...prev, zivotne_karakteristike: { ...prev.zivotne_karakteristike, [field]: value } }))
  }

  const getFleksibilnostLabel = (level) => {
    const labels = {
      0: '❌ Nema fleksibilnosti',
      1: '🤏 Minimalno',
      2: '😐 Malo',
      3: '👍 Srednje',
      4: '😊 Veoma fleksibilan',
      5: '✅ Svaki može'
    }
    return labels[level] || ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!currentUser) throw new Error('Korisnik nije prijavljen')
      
      // Validacija obaveznih polja
      if (!formData.kontaktosoba || !formData.kontaktosoba.trim()) {
        throw new Error('Kontakt osoba je obavezno polje')
      }
      if (!formData.kontakttelefon || !formData.kontakttelefon.trim()) {
        throw new Error('Telefon je obavezno polje')
      }

      const traznjaData = {
        datumkreiranja: new Date().toISOString(),
        datumpromene: new Date().toISOString(),
        kontaktosoba: formData.kontaktosoba || null,
        kontakttelefon: formData.kontakttelefon || null,
        strukturaod: formData.strukturaod ? parseFloat(formData.strukturaod) : null,
        strukturado: formData.strukturado ? parseFloat(formData.strukturado) : null,
        kvadraturaod: formData.kvadraturaod ? parseFloat(formData.kvadraturaod) : null,
        kvadraturado: formData.kvadraturado ? parseFloat(formData.kvadraturado) : null,
        cenaod: formData.cenaod ? parseFloat(formData.cenaod) : null,
        cenado: formData.cenado ? parseFloat(formData.cenado) : null,
        detaljitraznje: formData.detaljitraznje || null,
        metapodaci: metapodaci,
        ai_karakteristike: aiKarakteristike,
        stsaktivan: formData.stsaktivan,
        stskupaczakupac: formData.stskupaczakupac || null,
        statuskupca: formData.statuskupca || null,
        // Nova polja za sprat
        spratod: formData.spratod ? parseFloat(formData.spratod) : null,
        spratdo: formData.spratdo ? parseFloat(formData.spratdo) : null,
        stsnecezadnjispratat: formData.stsnecezadnjispratat || false,
        stsnecesuteren: formData.stsnecesuteren || false,
        iduser: currentUser?.id || null
      }

      if (formData.iddrzava) traznjaData.iddrzava = parseInt(formData.iddrzava)
      if (formData.idgrada) traznjaData.idgrada = parseInt(formData.idgrada)
      if (formData.idopstina) traznjaData.idopstina = parseInt(formData.idopstina)
      if (formData.idlokacija) traznjaData.idlokacija = parseInt(formData.idlokacija)
      if (formData.idulica) traznjaData.idulica = parseInt(formData.idulica)

      if (isEditing) {
        delete traznjaData.datumkreiranja
        const { error: updateError } = await supabase
          .from('traznja')
          .update(traznjaData)
          .eq('id', traznja.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('traznja')
          .insert([traznjaData])

        if (insertError) throw insertError
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Greška pri čuvanju tražnje')
      console.error('Greška:', err)
    } finally {
      setLoading(false)
    }
  }

  // Dobij punu putanju lokacije
  const getLokalitetPath = () => {
    if (!formData.idulica) return ''
    const selectedUlica = sveUliceSaRelacijama.find(u => u.id === parseInt(formData.idulica))
    if (!selectedUlica) return ''
    
    const lokacija = selectedUlica.lokacija
    const opstina = lokacija?.opstina
    const grad = opstina?.grad
    const drzava = grad?.drzava
    
    return [drzava?.opis, grad?.opis, opstina?.opis, lokacija?.opis, selectedUlica.opis].filter(Boolean).join(' > ')
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl my-auto max-h-[95vh] overflow-y-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-black px-6 py-5 flex justify-between items-center z-10 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {isEditing ? 'Izmena tražnje' : 'Dodaj novu tražnju'}
              </h2>
              <p className="text-gray-400 text-sm">
                {isEditing ? `ID: ${traznja.id}` : 'Unesite podatke o tražnji'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Osnovne informacije */}
          <section className="mb-6">
            <button
              type="button"
              onClick={() => toggleSection('osnovne')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/25">
                  <Info className="w-5 h-5 text-white" />
                </span>
                Osnovne informacije
              </h3>
              <div className={`w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center transition-transform duration-300 ${openSections.osnovne ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5 text-amber-400" />
              </div>
            </button>
            
            {openSections.osnovne && (
              <div className="mt-4 space-y-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                {/* Tip tražnje: Kupac/Zakupac */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center text-white text-xs">🎯</span>
                    Tip tražnje
                  </h4>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('stskupaczakupac', 'kupac')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                        formData.stskupaczakupac === 'kupac'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      🏠 Kupac
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('stskupaczakupac', 'zakupac')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                        formData.stskupaczakupac === 'zakupac'
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      🔑 Zakupac
                    </button>
                  </div>
                </div>

                {/* Kontakt */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center text-white text-xs">📞</span>
                    Kontakt informacije
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        👤 Kontakt osoba <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.kontaktosoba}
                        onChange={(e) => handleFieldChange('kontaktosoba', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Ime i prezime"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        📱 Telefon <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.kontakttelefon}
                          onChange={(e) => handleFieldChange('kontakttelefon', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                            duplicatePhone ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
                          }`}
                          placeholder="+381 XX XXX XXXX"
                          required
                        />
                        {checkingPhone && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      {/* Upozorenje o duplikatu */}
                      {duplicatePhone && duplicatePhone.length > 0 && (
                        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 text-orange-700 font-medium text-sm mb-2">
                            <span>⚠️</span>
                            <span>Pronađene postojeće tražnje sa ovim brojem!</span>
                          </div>
                          <div className="space-y-1">
                            {duplicatePhone.map((dup) => (
                              <div key={dup.id} className="text-xs text-orange-600 bg-white/50 rounded px-2 py-1">
                                <span className="font-semibold">ID: {dup.id}</span>
                                {dup.kontaktosoba && <span> • {dup.kontaktosoba}</span>}
                                <span> • {dup.kontakttelefon}</span>
                                {dup.datumkreiranja && (
                                  <span className="text-orange-500"> • {new Date(dup.datumkreiranja).toLocaleDateString('sr-RS')}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status kupca */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <span>🔥</span> Status kupca
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'vruc', emoji: '🔥', label: 'Vruci', color: 'from-red-400 to-orange-400', border: 'border-red-300' },
                      { value: 'mlak', emoji: '🟡', label: 'Mlaki', color: 'from-yellow-400 to-amber-400', border: 'border-yellow-300' },
                      { value: 'hladan', emoji: '❄️', label: 'Hladni', color: 'from-blue-400 to-cyan-400', border: 'border-blue-300' }
                    ].map(status => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => handleFieldChange('statuskupca', status.value)}
                        className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                          formData.statuskupca === status.value
                            ? `bg-gradient-to-br ${status.color} text-white ${status.border} shadow-lg`
                            : `bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md`
                        }`}
                      >
                        <span className="text-2xl">{status.emoji}</span>
                        <span className="text-xs">{status.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cena */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center text-white text-xs">💰</span>
                    Cena
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cena od (€)</label>
                      <input
                        type="number"
                        value={formData.cenaod}
                        onChange={(e) => handleFieldChange('cenaod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cena do (€)</label>
                      <input
                        type="number"
                        value={formData.cenado}
                        onChange={(e) => handleFieldChange('cenado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Kvadratura i struktura */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center text-white text-xs">📐</span>
                    Kvadratura i struktura
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">m² od</label>
                      <input
                        type="number"
                        value={formData.kvadraturaod}
                        onChange={(e) => handleFieldChange('kvadraturaod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">m² do</label>
                      <input
                        type="number"
                        value={formData.kvadraturado}
                        onChange={(e) => handleFieldChange('kvadraturado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Soba od</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.strukturaod}
                        onChange={(e) => handleFieldChange('strukturaod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Soba do</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.strukturado}
                        onChange={(e) => handleFieldChange('strukturado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Sprat */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center text-white text-xs">🏢</span>
                    Sprat
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sprat od</label>
                      <input
                        type="number"
                        value={formData.spratod}
                        onChange={(e) => handleFieldChange('spratod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sprat do</label>
                      <input
                        type="number"
                        value={formData.spratdo}
                        onChange={(e) => handleFieldChange('spratdo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 text-sm bg-white hover:bg-red-50 rounded-lg px-3 py-2 cursor-pointer border border-gray-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.stsnecezadnjispratat}
                        onChange={(e) => handleFieldChange('stsnecezadnjispratat', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-gray-700">🚫 Neće zadnji sprat</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm bg-white hover:bg-red-50 rounded-lg px-3 py-2 cursor-pointer border border-gray-200 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.stsnecesuteren}
                        onChange={(e) => handleFieldChange('stsnecesuteren', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-gray-700">🚫 Neće suteren</span>
                    </label>
                  </div>
                </div>

                {/* Detalji tražnje */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center text-white text-xs">📝</span>
                    Detalji tražnje
                  </h4>
                  <textarea
                    value={formData.detaljitraznje}
                    onChange={(e) => handleFieldChange('detaljitraznje', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y"
                    rows="3"
                    placeholder="Dodatne napomene o tražnji..."
                  />
                </div>
              </div>
            )}
          </section>

          {/* Lokacija */}
          <section className="mb-6">
            <button
              type="button"
              onClick={() => toggleSection('lokacija')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/25">
                  <MapPin className="w-5 h-5 text-white" />
                </span>
                Lokacija
              </h3>
              <div className={`w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center transition-transform duration-300 ${openSections.lokacija ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5 text-amber-400" />
              </div>
            </button>
            
            {openSections.lokacija && (
              <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  {/* Autocomplete ulica */}
                  <div className="mb-4" data-ulica-autocomplete>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">🏠 Pretraga ulice</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={ulicaSearchTerm}
                        onChange={(e) => {
                          setUlicaSearchTerm(e.target.value)
                          setShowUlicaDropdown(true)
                        }}
                        onFocus={() => { if (filteredUlice.length > 0) setShowUlicaDropdown(true) }}
                        placeholder="Kucajte naziv ulice..."
                        className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      />
                      {ulicaSearchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setUlicaSearchTerm('')
                            setFormData(prev => ({ ...prev, iddrzava: '', idgrada: '', idopstina: '', idlokacija: '', idulica: '' }))
                            setShowUlicaDropdown(false)
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    
                      {showUlicaDropdown && filteredUlice.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredUlice.map((ulica) => {
                            const lokacija = ulica.lokacija
                            const opstina = lokacija?.opstina
                            const grad = opstina?.grad
                            const drzava = grad?.drzava
                            const fullPath = [drzava?.opis, grad?.opis, opstina?.opis, lokacija?.opis, ulica.opis].filter(Boolean).join(', ')
                            
                            return (
                              <button
                                key={ulica.id}
                                type="button"
                                onClick={() => handleUlicaSelect(ulica)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="font-medium text-gray-900">{ulica.opis}</div>
                                {fullPath && <div className="text-sm text-gray-500 truncate">{fullPath}</div>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prikaz izabrane lokacije */}
                  {formData.idulica && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-xs text-amber-600 font-medium mb-1">Izabrana lokacija:</div>
                      <div className="text-sm text-amber-800">{getLokalitetPath()}</div>
                    </div>
                  )}

                  {/* Dropdown-ovi za lokaciju */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">🌍 Država</label>
                      <select
                        value={formData.iddrzava}
                        onChange={(e) => handleFieldChange('iddrzava', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      >
                        <option value="">Izaberi</option>
                        {drzave.map(d => <option key={d.id} value={d.id}>{d.opis}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">🏙️ Grad</label>
                      <select
                        value={formData.idgrada}
                        onChange={(e) => handleFieldChange('idgrada', e.target.value)}
                        disabled={!formData.iddrzava}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Izaberi</option>
                        {gradovi.map(g => <option key={g.id} value={g.id}>{g.opis}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">🏘️ Opština</label>
                      <select
                        value={formData.idopstina}
                        onChange={(e) => handleFieldChange('idopstina', e.target.value)}
                        disabled={!formData.idgrada}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Izaberi</option>
                        {opstine.map(o => <option key={o.id} value={o.id}>{o.opis}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">📍 Lokacija</label>
                      <select
                        value={formData.idlokacija}
                        onChange={(e) => handleFieldChange('idlokacija', e.target.value)}
                        disabled={!formData.idopstina}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Izaberi</option>
                        {lokacije.map(l => <option key={l.id} value={l.id}>{l.opis}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">🛣️ Ulica</label>
                      <select
                        value={formData.idulica}
                        onChange={(e) => handleFieldChange('idulica', e.target.value)}
                        disabled={!formData.idlokacija}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Izaberi</option>
                        {ulice.map(u => <option key={u.id} value={u.id}>{u.opis}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* AI Karakteristike */}
          <section className="mb-6">
            <button
              type="button"
              onClick={() => toggleSection('ai')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/25">
                  <Brain className="w-5 h-5 text-white" />
                </span>
                AI Karakteristike (za pretragu)
              </h3>
              <div className={`w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center transition-transform duration-300 ${openSections.ai ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5 text-amber-400" />
              </div>
            </button>
            
            {openSections.ai && (
              <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-4">
                
                {/* Ekologija & Energija */}
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-200">
                  <h4 className="font-semibold text-teal-800 mb-3 flex items-center gap-2">
                    <span>🌍</span> Ekologija & Energija
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pogled na */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">👁️ Pogled na</label>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { value: 'park', label: '🌳 Park' },
                          { value: 'ulica', label: '🛣️ Ulica' },
                          { value: 'dvoriste', label: '🏡 Dvorište' },
                          { value: 'reka', label: '🌊 Reka' },
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
                    {/* Kvalitet vazduha i Energetski razred */}
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
                          <option value="E">E</option>
                        </select>
                      </div>
                    </div>
                    {/* Eko karakteristike */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 mb-2">♻️ Eko karakteristike</label>
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
                        <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1.5">
                          <span className="text-xs">🌿</span>
                          <input type="number" min="0" max="100" value={aiKarakteristike.ekologija?.zelena_povrsina || 0} onChange={(e) => handleAiEkologijaChange('zelena_povrsina', parseInt(e.target.value) || 0)} className="w-12 px-1 py-0.5 border border-gray-200 rounded text-xs text-center" />
                          <span className="text-xs text-gray-500">% zeleno</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bezbednost */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <span>🛡️</span> Bezbednost
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'portir', icon: '👮', label: 'Portir u zgradi' },
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

                {/* Životni stil */}
                <div className="bg-gradient-to-br from-green-50 to-lime-50 rounded-xl p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <span>🌿</span> Životni stil
                  </h4>
                  {/* Checkboxes */}
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
                  {/* Selecti */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">🐾 Pet-friendly</label>
                      <input type="number" min="0" max="5" value={aiKarakteristike.zivotni_stil?.pet_friendly || 0} onChange={(e) => handleAiZivotniStilChange('pet_friendly', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white" placeholder="0-5" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">🔊 Buka</label>
                      <select value={aiKarakteristike.zivotni_stil?.nivo_buke || ''} onChange={(e) => handleAiZivotniStilChange('nivo_buke', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white">
                        <option value="">-</option>
                        <option value="nisko">Nisko</option>
                        <option value="srednje">Srednje</option>
                        <option value="visoko">Visoko</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">☀️ Sunce</label>
                      <select value={aiKarakteristike.zivotni_stil?.osuncanost || ''} onChange={(e) => handleAiZivotniStilChange('osuncanost', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white">
                        <option value="">-</option>
                        <option value="slabo">Slabo</option>
                        <option value="srednje">Srednje</option>
                        <option value="jako">Jako</option>
                      </select>
                    </div>
                  </div>
                  {/* Blizina (min pešice) */}
                  <label className="block text-xs text-gray-600 mb-2">📍 Blizina (min pešice)</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">🌳</span>
                      <div className="text-xs text-gray-500">Park</div>
                      <input type="number" min="0" value={aiKarakteristike.zivotni_stil?.blizina_parka || 0} onChange={(e) => handleAiZivotniStilChange('blizina_parka', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">🏋️</span>
                      <div className="text-xs text-gray-500">Teretana</div>
                      <input type="number" min="0" value={aiKarakteristike.zivotni_stil?.blizina_teretane || 0} onChange={(e) => handleAiZivotniStilChange('blizina_teretane', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">🛒</span>
                      <div className="text-xs text-gray-500">Prodavnica</div>
                      <input type="number" min="0" value={aiKarakteristike.zivotni_stil?.blizina_prodavnice || 0} onChange={(e) => handleAiZivotniStilChange('blizina_prodavnice', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">💊</span>
                      <div className="text-xs text-gray-500">Apoteka</div>
                      <input type="number" min="0" value={aiKarakteristike.zivotni_stil?.blizina_apoteke || 0} onChange={(e) => handleAiZivotniStilChange('blizina_apoteke', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">🏥</span>
                      <div className="text-xs text-gray-500">Bolnica</div>
                      <input type="number" min="0" value={aiKarakteristike.zivotni_stil?.blizina_bolnice || 0} onChange={(e) => handleAiZivotniStilChange('blizina_bolnice', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">🚌</span>
                      <div className="text-xs text-gray-500">Autobus</div>
                      <input type="number" min="0" value={aiKarakteristike.zivotni_stil?.blizina_autobuske || 0} onChange={(e) => handleAiZivotniStilChange('blizina_autobuske', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                  </div>
                </div>

                {/* Mikrolokacija */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <span>📍</span> Mikrolokacija
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <label className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-100 rounded-lg px-3 py-2 cursor-pointer">
                      <input type="checkbox" checked={aiKarakteristike.mikrolokacija?.mirna_ulica || false} onChange={(e) => handleAiMikrolokacijaChange('mirna_ulica', e.target.checked)} className="rounded border-gray-300 text-purple-600 w-3.5 h-3.5" />
                      <span>🤫</span><span className="text-gray-700">Mirna ulica</span>
                    </label>
                    <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1.5">
                      <span className="text-xs">🅿️</span>
                      <span className="text-xs text-gray-600">Parking zona:</span>
                      <select value={aiKarakteristike.mikrolokacija?.parking_zona || ''} onChange={(e) => handleAiMikrolokacijaChange('parking_zona', e.target.value)} className="px-1 py-0.5 border border-gray-200 rounded text-xs bg-white">
                        <option value="">-</option>
                        <option value="besplatna">Besplatna</option>
                        <option value="zona1">Zona 1</option>
                        <option value="zona2">Zona 2</option>
                        <option value="zona3">Zona 3</option>
                      </select>
                    </div>
                  </div>
                  {/* Udaljenosti (min pešice) */}
                  <label className="block text-xs text-gray-600 mb-2">🚶 Udaljenosti (min pešice)</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">🏫</span>
                      <div className="text-xs text-gray-500">Škola</div>
                      <input type="number" min="0" value={aiKarakteristike.mikrolokacija?.skola_minuta || 0} onChange={(e) => handleAiMikrolokacijaChange('skola_minuta', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">👶</span>
                      <div className="text-xs text-gray-500">Vrtić</div>
                      <input type="number" min="0" value={aiKarakteristike.mikrolokacija?.vrtic_minuta || 0} onChange={(e) => handleAiMikrolokacijaChange('vrtic_minuta', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">🎓</span>
                      <div className="text-xs text-gray-500">Fakultet</div>
                      <input type="number" min="0" value={aiKarakteristike.mikrolokacija?.fakultet_minuta || 0} onChange={(e) => handleAiMikrolokacijaChange('fakultet_minuta', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">🚇</span>
                      <div className="text-xs text-gray-500">Metro</div>
                      <input type="number" min="0" value={aiKarakteristike.mikrolokacija?.metro_minuta || 0} onChange={(e) => handleAiMikrolokacijaChange('metro_minuta', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">🏙️</span>
                      <div className="text-xs text-gray-500">Centar</div>
                      <input type="number" min="0" value={aiKarakteristike.mikrolokacija?.blizina_centra || 0} onChange={(e) => handleAiMikrolokacijaChange('blizina_centra', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <span className="text-sm">⚡</span>
                      <div className="text-xs text-gray-500">EV punjač</div>
                      <input type="number" min="0" value={aiKarakteristike.mikrolokacija?.ev_punjac_metara || 0} onChange={(e) => handleAiMikrolokacijaChange('ev_punjac_metara', parseInt(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-center mt-1" />
                    </div>
                  </div>
                </div>

                {/* Opremljenost */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <span>🏠</span> Opremljenost
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { key: 'sts_internet', label: '🌐 Internet' },
                      { key: 'sts_kablovska', label: '📺 Kablovska' },
                      { key: 'sts_frizider', label: '❄️ Frižider' },
                      { key: 'sts_sporet', label: '🍳 Šporet' },
                      { key: 'sts_vesmasina', label: '🧺 Veš mašina' },
                      { key: 'sts_tv', label: '📺 TV' },
                      { key: 'klima', label: '❄️ Klima' },
                      { key: 'sudomasina', label: '🍽️ Sudomašina' },
                      { key: 'sts_mikrotalasna', label: '📡 Mikrotalasna' },
                      { key: 'sts_pegla', label: '👔 Pegla' },
                      { key: 'sts_usisivac', label: '🧹 Usisivač' },
                      { key: 'sts_fen', label: '💨 Fen' },
                      { key: 'sts_grejalica', label: '🔥 Grejalica' },
                      { key: 'sts_roletne', label: '🪟 Roletne' },
                      { key: 'sts_alarm', label: '🚨 Alarm' },
                      { key: 'sts_video_nadzor', label: '📹 Video nadzor' },
                      { key: 'sts_smart_home', label: '🏠 Smart home' }
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 p-2 bg-white rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={aiKarakteristike.opremljenost?.[item.key] || false}
                          onChange={(e) => handleAiOpremljenostChange(item.key, e.target.checked)}
                          className="rounded border-gray-300 text-amber-600"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 🎯 PRIORITETI KUPCA */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <span>🎯</span> Prioriteti kupca
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { field: 'prioritet_cena', label: '💰 Cena' },
                      { field: 'prioritet_lokacija', label: '📍 Lokacija' },
                      { field: 'prioritet_opremljenost', label: '🏠 Opremljenost' },
                      { field: 'prioritet_kvadratura', label: '📐 Kvadratura' },
                      { field: 'prioritet_struktura', label: '🛏️ Struktura' },
                      { field: 'prioritet_sprat', label: '🏢 Sprat' },
                      { field: 'prioritet_bezbednost', label: '🛡️ Bezbednost' }
                    ].map(item => (
                      <div key={item.field}>
                        <label className="block text-xs text-gray-600 mb-1">{item.label}</label>
                        <select
                          value={aiKarakteristike.prioriteti?.[item.field] || ''}
                          onChange={(e) => handleAiPriorititiChange(item.field, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-blue-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-</option>
                          <option value="nije_bitan">⚪ Nije bitan</option>
                          <option value="vazan">🟡 Važan</option>
                          <option value="veoma_vazan">🔴 Veoma važan</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 📊 FLEKSIBILNOST KUPCA */}
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <span>📊</span> Fleksibilnost kupca
                  </h4>
                  <div className="space-y-3">
                    {[
                      { field: 'fleksibilnost_cena', label: '💰 Cena (koliko ±% može)' },
                      { field: 'fleksibilnost_kvadratura', label: '📐 Kvadratura' },
                      { field: 'fleksibilnost_struktura', label: '🛏️ Struktura' },
                      { field: 'fleksibilnost_sprat', label: '🏢 Sprat' },
                      { field: 'fleksibilnost_lokacija', label: '📍 Lokacija' }
                    ].map(item => (
                      <div key={item.field}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-gray-600">{item.label}</label>
                          <span className="text-xs font-semibold text-orange-700">
                            {getFleksibilnostLabel(aiKarakteristike.fleksibilnost?.[item.field] || 0)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          value={aiKarakteristike.fleksibilnost?.[item.field] || 0}
                          onChange={(e) => handleAiFleksibilnostChange(item.field, parseInt(e.target.value))}
                          className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 👥 ŽIVOTNE KARAKTERISTIKE */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200">
                  <h4 className="font-semibold text-pink-800 mb-3 flex items-center gap-2">
                    <span>👥</span> Životne karakteristike
                  </h4>
                  <div className="space-y-3">
                    {/* Checkboxes */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { field: 'ima_autoparking', label: '🚗 Ima automobil' },
                        { field: 'koristi_javni_prevoz', label: '🚌 Javni prevoz' },
                        { field: 'radno_vreme_fleksibilno', label: '⏰ Fleksibilno vreme' },
                        { field: 'radi_od_kuce_moguce', label: '💻 Rad od kuće' }
                      ].map(item => (
                        <label key={item.field} className="flex items-center gap-2 p-2 bg-white rounded-lg cursor-pointer hover:bg-pink-50">
                          <input
                            type="checkbox"
                            checked={aiKarakteristike.zivotne_karakteristike?.[item.field] || false}
                            onChange={(e) => handleAiZivotneKarakteristikeChange(item.field, e.target.checked)}
                            className="rounded border-gray-300 text-pink-600"
                          />
                          <span className="text-sm text-gray-700">{item.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Select inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">🐾 Kućni ljubimci</label>
                        <select
                          value={aiKarakteristike.zivotne_karakteristike?.ima_kucne_ljubimce || ''}
                          onChange={(e) => handleAiZivotneKarakteristikeChange('ima_kucne_ljubimce', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-pink-300 rounded-lg focus:ring-1 focus:ring-pink-500"
                        >
                          <option value="">-</option>
                          <option value="nema">Nema</option>
                          <option value="mali">Mali (ptica, riba)</option>
                          <option value="srednji">Srednji (mačka)</option>
                          <option value="veliki">Veliki (pas)</option>
                          <option value="vise">Više / veliki pas</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">👥 Broj osoba</label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={aiKarakteristike.zivotne_karakteristike?.broj_ukucana || 1}
                          onChange={(e) => handleAiZivotneKarakteristikeChange('broj_ukucana', parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-pink-300 rounded-lg focus:ring-1 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">👨‍👩‍👧 Tip domaćinstva</label>
                        <select
                          value={aiKarakteristike.zivotne_karakteristike?.tip_domacinstva || ''}
                          onChange={(e) => handleAiZivotneKarakteristikeChange('tip_domacinstva', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-pink-300 rounded-lg focus:ring-1 focus:ring-pink-500"
                        >
                          <option value="">-</option>
                          <option value="samotan">Samotan/a</option>
                          <option value="par">Par</option>
                          <option value="porodica">Porodica</option>
                          <option value="grupe">Grupe/Studenti</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </section>

          {/* METAPODACI - Tabovi */}
          <section className="mb-6">
            <button
              type="button"
              onClick={() => toggleSection('metapodaci')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/25">
                  <Users className="w-5 h-5 text-white" />
                </span>
                Metapodaci
              </h3>
              <div className={`w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center transition-transform duration-300 ${openSections.metapodaci ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-5 h-5 text-amber-400" />
              </div>
            </button>
            
            {openSections.metapodaci && (
              <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                {/* Tab navigacija */}
                <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: 'nalogodavci', label: 'Nalogodavci', emoji: '👥' },
                    { id: 'eop', label: 'EOP', emoji: '📄' },
                    { id: 'realizacija', label: 'Realizacija', emoji: '✅' },
                    { id: 'zastupnik', label: 'Zastupnik', emoji: '👤' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveMetaTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        activeMetaTab === tab.id
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                      }`}
                    >
                      <span className="text-base">{tab.emoji}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab sadržaj */}
                <div className="bg-slate-50 rounded-xl p-5">
                  {/* NALOGODAVCI TAB */}
                  {activeMetaTab === 'nalogodavci' && (
                    <div className="space-y-4">
                      {metapodaci.nalogodavci.map((nalogodavac, index) => (
                        <div key={index} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                <span className="text-lg">👤</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800">Nalogodavac {index + 1}</h4>
                                <p className="text-xs text-slate-500">Podaci o nalogodavcu</p>
                              </div>
                            </div>
                            {metapodaci.nalogodavci.length > 1 && (
                              <button type="button" onClick={() => removeNalogodavac(index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          {/* Lični podaci */}
                          <div className="mb-4">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">📋 Lični podaci</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <input type="text" value={nalogodavac.ime} onChange={(e) => handleNalogodavacChange(index, 'ime', e.target.value)} placeholder="Ime" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                              <input type="text" value={nalogodavac.prezime} onChange={(e) => handleNalogodavacChange(index, 'prezime', e.target.value)} placeholder="Prezime" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                              <input type="text" value={nalogodavac.matbrojjmbg} onChange={(e) => handleNalogodavacChange(index, 'matbrojjmbg', e.target.value)} placeholder="Mat. broj / JMBG" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>

                          {/* Kontakt */}
                          <div className="mb-4">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">📞 Kontakt</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <input type="email" value={nalogodavac.email} onChange={(e) => handleNalogodavacChange(index, 'email', e.target.value)} placeholder="Email" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                              <input type="text" value={nalogodavac.brojtel} onChange={(e) => handleNalogodavacChange(index, 'brojtel', e.target.value)} placeholder="Telefon" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                              <input type="text" value={nalogodavac.adresa} onChange={(e) => handleNalogodavacChange(index, 'adresa', e.target.value)} placeholder="Adresa" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>

                          {/* Dokumentacija */}
                          <div className="mb-4">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">🪪 Dokumentacija</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <input type="text" value={nalogodavac.identisprava} onChange={(e) => handleNalogodavacChange(index, 'identisprava', e.target.value)} placeholder="Ident. isprava" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                              <input type="text" value={nalogodavac.lk} onChange={(e) => handleNalogodavacChange(index, 'lk', e.target.value)} placeholder="Broj LK" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                              <input type="text" value={nalogodavac.pib} onChange={(e) => handleNalogodavacChange(index, 'pib', e.target.value)} placeholder="PIB" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                              <input type="text" value={nalogodavac.mestorodjenja} onChange={(e) => handleNalogodavacChange(index, 'mestorodjenja', e.target.value)} placeholder="Mesto rođenja" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>

                          {/* Datumi i ostalo */}
                          <div className="mb-4">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">📝 Ostalo</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Datum rođenja</label>
                                <input type="date" value={nalogodavac.datumrodjenja || ''} onChange={(e) => handleNalogodavacChange(index, 'datumrodjenja', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Datum zadnje provere</label>
                                <input type="date" value={nalogodavac.datumzadnjeprovere || ''} onChange={(e) => handleNalogodavacChange(index, 'datumzadnjeprovere', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Status lica</label>
                                <select value={nalogodavac.stslice} onChange={(e) => handleNalogodavacChange(index, 'stslice', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                                  <option value="">Izaberi</option>
                                  <option value="fizicko">Fizičko lice</option>
                                  <option value="pravno">Pravno lice</option>
                                  <option value="preduzetnik">Preduzetnik</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Poreklo imovine i kategorizacija */}
                          <div className="mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input type="text" value={nalogodavac.porekloimovine} onChange={(e) => handleNalogodavacChange(index, 'porekloimovine', e.target.value)} placeholder="Poreklo imovine" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                              <input type="text" value={nalogodavac.finalnakategorizacija} onChange={(e) => handleNalogodavacChange(index, 'finalnakategorizacija', e.target.value)} placeholder="Finalna kategorizacija" className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>

                          {/* Status checkboxes */}
                          <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                            <label className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                              <input type="checkbox" checked={nalogodavac.stsrezident} onChange={(e) => handleNalogodavacChange(index, 'stsrezident', e.target.checked)} className="rounded border-slate-300 text-slate-600" />
                              <span className="text-slate-700">🏠 Rezident</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                              <input type="checkbox" checked={nalogodavac.stvarnivlasnikstranke} onChange={(e) => handleNalogodavacChange(index, 'stvarnivlasnikstranke', e.target.checked)} className="rounded border-slate-300 text-slate-600" />
                              <span className="text-slate-700">✓ Stvarni vlasnik stranke</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm bg-slate-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                              <input type="checkbox" checked={nalogodavac.sumnjapranjenovca} onChange={(e) => handleNalogodavacChange(index, 'sumnjapranjenovca', e.target.checked)} className="rounded border-slate-300 text-slate-600" />
                              <span className="text-slate-700">⚠️ Sumnja na pranje novca</span>
                            </label>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addNalogodavac} className="flex items-center gap-2 px-5 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors shadow-sm">
                        <Plus className="w-4 h-4" />
                        Dodaj nalogodavca
                      </button>
                    </div>
                  )}

                  {/* EOP TAB */}
                  {activeMetaTab === 'eop' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                          <span className="text-lg">📄</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">Evidencija o posredovanju</h4>
                          <p className="text-xs text-slate-500">Ugovor i katastarski podaci</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={metapodaci.eop.stsugovorpotpisan} onChange={(e) => handleEopChange('stsugovorpotpisan', e.target.checked)} className="rounded border-slate-300 text-slate-600 w-5 h-5" />
                            <span className="text-sm font-medium text-slate-700">✍️ Ugovor potpisan</span>
                          </label>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">📅 Datumi</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Datum ugovora</label>
                              <input type="date" value={metapodaci.eop.datumugovora} onChange={(e) => handleEopChange('datumugovora', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Datum isteka</label>
                              <input type="date" value={metapodaci.eop.datumistice} onChange={(e) => handleEopChange('datumistice', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">🗺️ Katastar</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Katastarska parcela</label>
                              <input type="text" value={metapodaci.eop.katastarskaparcela} onChange={(e) => handleEopChange('katastarskaparcela', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Broj parcele" />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Katastarska opština</label>
                              <input type="text" value={metapodaci.eop.katopstina} onChange={(e) => handleEopChange('katopstina', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Naziv opštine" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* REALIZACIJA TAB */}
                  {activeMetaTab === 'realizacija' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <span className="text-lg">✅</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">Realizacija</h4>
                          <p className="text-xs text-slate-500">Podaci o zaključenom poslu</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={metapodaci.realizacija.zakljucen} onChange={(e) => handleRealizacijaChange('zakljucen', e.target.checked)} className="rounded border-emerald-300 text-emerald-600 w-5 h-5" />
                            <span className="text-sm font-medium text-emerald-700">🎉 Posao zaključen</span>
                          </label>
                        </div>

                        {/* Nekretnina */}
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">🏠 Nekretnina</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Vrsta objekta</label>
                              <input type="text" value={metapodaci.realizacija.vrstaobjekta} onChange={(e) => handleRealizacijaChange('vrstaobjekta', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Opština nekretnisti</label>
                              <input type="text" value={metapodaci.realizacija.opstinanekretnisti} onChange={(e) => handleRealizacijaChange('opstinanekretnisti', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Površina (m²)</label>
                              <input type="number" value={metapodaci.realizacija.povrsina} onChange={(e) => handleRealizacijaChange('povrsina', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-slate-600 mb-1">Adresa nekretnisti</label>
                          <input type="text" value={metapodaci.realizacija.adresanekretnosti} onChange={(e) => handleRealizacijaChange('adresanekretnosti', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                        </div>

                        {/* Finansije */}
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">💰 Finansije</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Datum zaključenja</label>
                              <input type="date" value={metapodaci.realizacija.datumzakljucenja} onChange={(e) => handleRealizacijaChange('datumzakljucenja', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Kupoprodajna cena (€)</label>
                              <input type="number" value={metapodaci.realizacija.kupoprodajnacena} onChange={(e) => handleRealizacijaChange('kupoprodajnacena', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Provizija (€)</label>
                              <input type="number" value={metapodaci.realizacija.provizija} onChange={(e) => handleRealizacijaChange('provizija', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>
                        </div>

                        {/* Detalji */}
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">📝 Detalji</p>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Namena transakcije</label>
                              <input type="text" value={metapodaci.realizacija.namenatransakcije} onChange={(e) => handleRealizacijaChange('namenatransakcije', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Npr. stanovanje, investicija..." />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Primedba</label>
                              <textarea value={metapodaci.realizacija.primedba} onChange={(e) => handleRealizacijaChange('primedba', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" rows="2" placeholder="Dodatne napomene..." />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ZASTUPNIK TAB */}
                  {activeMetaTab === 'zastupnik' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">Zastupnik</h4>
                          <p className="text-xs text-slate-500">Podaci o zastupniku nalogodavca</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">📋 Lični podaci</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Ime</label>
                              <input type="text" value={metapodaci.zastupnik.ime} onChange={(e) => handleZastupnikChange('ime', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Prezime</label>
                              <input type="text" value={metapodaci.zastupnik.prezime} onChange={(e) => handleZastupnikChange('prezime', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">📍 Adresa</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                              <label className="block text-sm text-slate-600 mb-1">Adresa</label>
                              <input type="text" value={metapodaci.zastupnik.adresa} onChange={(e) => handleZastupnikChange('adresa', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Opština</label>
                              <input type="text" value={metapodaci.zastupnik.opstina} onChange={(e) => handleZastupnikChange('opstina', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">🪪 Dokumentacija</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Broj lične karte</label>
                              <input type="text" value={metapodaci.zastupnik.brojlicnekarte} onChange={(e) => handleZastupnikChange('brojlicnekarte', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Datum</label>
                              <input type="date" value={metapodaci.zastupnik.datum} onChange={(e) => handleZastupnikChange('datum', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-600 mb-1">Mesto izdavanja</label>
                              <input type="text" value={metapodaci.zastupnik.mestoizdavanja} onChange={(e) => handleZastupnikChange('mestoizdavanja', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold shadow-lg shadow-amber-500/25"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Čuvanje...' : (isEditing ? 'Sačuvaj izmene' : 'Sačuvaj tražnju')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
