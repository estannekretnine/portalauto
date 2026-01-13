import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabase'
import { getCurrentUser } from '../utils/auth'
import PhotoUpload from './PhotoUpload'
import { Save, X, Upload, Building2, MapPin, DollarSign, Ruler, Info, Search, ChevronDown, Users, FileText, Receipt, Wallet, UserCheck, Brain, Plus, Trash2 } from 'lucide-react'
import PropertyMap from './PropertyMap'

// Definicija polja po vrstama objekata
const FIELD_DEFINITIONS = {
  // Polja koja se prikazuju za sve vrste objekata
  all: [
    { key: 'naslovaoglasa', label: 'Naslov oglasa (lokacija, sprat, grejanje)', type: 'text', required: true, section: 'osnovne' },
    { key: 'cena', label: 'Cena (€)', type: 'number', required: true, section: 'osnovne' },
    { key: 'kvadratura', label: 'Kvadratura (m²)', type: 'number', section: 'osnovne' },
    { key: 'terasa', label: 'Terasa (m²)', type: 'text', section: 'osnovne' },
    { key: 'kvadraturaizugovora', label: 'Uknjižena kvadratura (m²)', type: 'number', section: 'osnovne' },
    { key: 'struktura', label: 'Struktura', type: 'number', section: 'tehnicke' },
    { key: 'opis', label: 'Opis', type: 'textarea', section: 'osnovne' },
  ],
  // Polja specifična za određene vrste objekata
  stan: [
    { key: 'spratstana', label: 'Sprat stana', type: 'number', section: 'tehnicke' },
    { key: 'spratnostzgrade', label: 'Spratnost zgrade', type: 'number', section: 'tehnicke' },
    { key: 'sprat', label: 'Sprat', type: 'text', section: 'tehnicke' },
    { key: 'stsuseljivost', label: 'Useljivost', type: 'select', options: ['Odmah', 'Vezano', 'Neuseljiv'], section: 'tehnicke' },
    { key: 'ststelefon', label: 'Telefon', type: 'checkbox', section: 'opremljenost' },
    { key: 'brojtelefona_linija', label: 'Broj tel. linija', type: 'select', options: ['Nema', '1', '2', '3', '4', '5+'], section: 'opremljenost' },
    { key: 'stslift', label: 'Lift', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsuknjizen', label: 'Uknižen', type: 'checkbox', section: 'opremljenost' },
    { key: 'stspodrum', label: 'Podrum', type: 'checkbox', section: 'opremljenost' },
    { key: 'ststoplavoda', label: 'Topla voda', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsinterfon', label: 'Interfon', type: 'checkbox', section: 'opremljenost' },
    { key: 'stszasebno', label: 'Zasebno', type: 'checkbox', section: 'opremljenost' },
    { key: 'stslodja', label: 'Lođa', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsfb', label: 'FB', type: 'checkbox', section: 'opremljenost' },
  ],
  plac: [
    { key: 'ari', label: 'ARI (m²)', type: 'number', section: 'tehnicke' },
    { key: 'stslegalizacija', label: 'Legalizacija', type: 'checkbox', section: 'tehnicke' },
    { key: 'stszasticen', label: 'Zaštićen', type: 'checkbox', section: 'tehnicke' },
  ],
  kuca: [
    { key: 'spratnostzgrade', label: 'Spratnost', type: 'number', section: 'tehnicke' },
    { key: 'etaze', label: 'Etaže', type: 'text', section: 'tehnicke' },
    { key: 'stsuseljivost', label: 'Useljivost', type: 'select', options: ['Odmah', 'Vezano', 'Neuseljiv'], section: 'tehnicke' },
    { key: 'stspodrum', label: 'Podrum', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsimagarazu', label: 'Ima garažu', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsimaparking', label: 'Ima parking', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsdvamokracvora', label: 'Dva mokraćvora', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsdupleks', label: 'Dupleks', type: 'checkbox', section: 'opremljenost' },
  ],
  poslovni: [
    { key: 'sprat', label: 'Sprat', type: 'text', section: 'tehnicke' },
    { key: 'opissekretarice', label: 'Opis sekretarice', type: 'textarea', section: 'tehnicke' },
    { key: 'prostorije', label: 'Prostorije', type: 'text', section: 'tehnicke' },
    { key: 'stssalonac', label: 'Salonac', type: 'checkbox', section: 'opremljenost' },
  ],
}

// Mapiranje vrsta objekata (može se proširiti)
const getVrstaObjektaKey = (vrstaObjektaOpis) => {
  if (!vrstaObjektaOpis) return 'all'
  const opis = vrstaObjektaOpis.toLowerCase()
  if (opis.includes('stan') || opis.includes('apartman')) return 'stan'
  if (opis.includes('plac') || opis.includes('zemljište')) return 'plac'
  if (opis.includes('kuća') || opis.includes('kuca') || opis.includes('vila')) return 'kuca'
  if (opis.includes('poslovni') || opis.includes('lokal') || opis.includes('kancelarija')) return 'poslovni'
  return 'all'
}

export default function PonudaForm({ onClose, onSuccess }) {
  const currentUser = getCurrentUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // DEBUG: Proveri da li se onClose/onSuccess pozivaju negde drugde
  useEffect(() => {
    console.log('🔵 PonudaForm montiran, onClose:', typeof onClose, 'onSuccess:', typeof onSuccess)
    return () => {
      console.log('🔴 PonudaForm unmount-ovan')
    }
  }, [])
  
  // Osnovne informacije
  const [formData, setFormData] = useState({
    idvrstaobjekta: '',
    iddrzava: '',
    idgrada: '',
    idopstina: '',
    idlokacija: '',
    idulica: '',
    brojulice: '',
    datumprijema: new Date().toISOString().split('T')[0], // Default: tekući datum
    naslovaoglasa: '',
    kontaktosoba: '',
    brojtelefona_linija: '',
    kvadratura: '',
    terasa: '',
    kvadraturaizugovora: '',
    struktura: '',
    sprat: '',
    spratstana: '',
    spratnostzgrade: '',
    idgrejanje: '',
    idinvestitor: '',
    cena: '',
    godinagradnje: '',
    opis: '',
    stsaktivan: true,
    stsrentaprodaja: 'prodaja',
    // Checkbox polja
    ststelefon: false,
    stslift: false,
    stsuknjizen: false,
    stspodrum: false,
    ststoplavoda: false,
    stsinterfon: false,
    stszasebno: false,
    stsimagarazu: false,
    stsimaparking: false,
    stsdvamokracvora: false,
    stslegalizacija: false,
    stszasticen: false,
    stsuseljivost: '',
    stsnovogradnja: false,
    stssalonac: false,
    stsdupleks: false,
    stssivafaza: false,
    stsuizgradnji: false,
    stsekskluziva: false,
    stshitnaprodaja: false,
    stslux: false,
    stszainvestiranje: false,
    stslodja: false,
    stsfb: false,
    // Dodatna polja
    ari: '',
    etaze: '',
    opissekretarice: '',
    prostorije: '',
    latitude: '',
    longitude: '',
    videolink: '',
    internenapomene: '',
    dokumentacija: '',
    link: '',
    vidljivostnasajtu: '',
    nivoenergetskeefikasnosti: '',
    '3dture': '',
    stsvertikalahorizontala: false,
  })

  // JSONB detalji
  const [detalji, setDetalji] = useState({
    osnovne: {},
    tehnicke: {},
    opremljenost: {},
    ai: {}
  })

  // Aktivni tab za metapodatke
  const [activeMetaTab, setActiveMetaTab] = useState('vlasnici')

  // State za otvorene/zatvorene sekcije (accordion)
  const [openSections, setOpenSections] = useState({
    osnovne: true,        // Osnovne informacije - otvoreno po defaultu
    tehnicke: false,      // Tehničke karakteristike - zatvoreno
    opremljenost: false,  // Opremljenost - zatvoreno
    dodatne: false,       // Dodatne informacije - zatvoreno
    fotografije: false,   // Fotografije - zatvoreno
    metapodaci: false     // Metapodaci - zatvoreno
  })

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // JSONB metapodaci
  const [metapodaci, setMetapodaci] = useState({
    vlasnici: [{
      ime: '', prezime: '', adresa: '', jmbg: '', email: '', tel: '',
      ident_isprava: '', lk: '', pib: '', id_drzava: '', sts_lice: '',
      poreklo_imovine: '', sumnja_pranje_novca: false, mesto_rodjenja: '',
      datum_rodjenja: '', sts_rezident: false, stvarnivlasnikstranke: false,
      datum_zadnje_provere: '', finalnakategorizacija: ''
    }],
    istorija_cene: [],
    eop: {
      sts_ugovor_potpisan: false, datum_ugovora: '', datum_istice: '',
      katastarska_parceka: '', kat_opstina: ''
    },
    realizacija: {
      zakljucen: false, datum_zakljucenja: '', kupoprodajna_cena: 0,
      provizija: 0, primedba: '', namena_transakcije: ''
    },
    troskovi: {
      infostan: 0, kablovska: 0, struja: 0, telefon: 0, internet: 0, odrzavanje: 0, ostalo: 0
    },
    zastupnik: {
      ime: '', prezime: '', adresa: '', opstina: '', lk: '', datum: '', mesto: ''
    }
  })

  // JSONB ai_karakteristike
  const [aiKarakteristike, setAiKarakteristike] = useState({
    opremljenost: {
      sts_internet: false, sts_kablovska: false, sts_frizider: false, sts_sporet: false,
      sts_vesmasina: false, sts_tv: false, klima: false, sudomasina: false,
      // Nova polja
      sts_masina_sudje: false, sts_mikrotalasna: false, sts_pegla: false,
      sts_usisivac: false, sts_fen: false, sts_grejalica: false,
      sts_roletne: false, sts_alarm: false, sts_video_nadzor: false, sts_smart_home: false
    },
    zivotni_stil: {
      rad_od_kuce: false, pet_friendly: 0, nivo_buke: '', osuncanost: '',
      // Nova polja
      blizina_parka: 0, blizina_teretane: 0, blizina_prodavnice: 0,
      blizina_apoteke: 0, blizina_bolnice: 0, blizina_autobuske: 0,
      pusenje_dozvoljeno: false, pogodan_za_decu: false,
      pogodan_za_studente: false, pogodan_za_penzionere: false
    },
    ekologija: {
      pogled: [], indeks_vazduha: '', energetski_razred: '',
      // Nova polja
      solarni_paneli: false, toplotna_pumpa: false,
      reciklaza: false, zelena_povrsina: 0
    },
    mikrolokacija: {
      mirna_ulica: false, skola_minuta: 0, ev_punjac_metara: 0,
      // Nova polja
      vrtic_minuta: 0, fakultet_minuta: 0, metro_minuta: 0,
      parking_zona: '', blizina_centra: 0
    },
    // Nova kategorija
    bezbednost: {
      portir: false, video_interfon: false, protivpozarni_sistem: false,
      osigurana_zgrada: false, sigurnosna_vrata: false
    }
  })

  // Praćenje prethodne cene za automatsku istoriju
  const previousCenaRef = useRef(null)

  // Fotografije
  const [photos, setPhotos] = useState([])

  // Lookup podaci
  const [vrsteObjekata, setVrsteObjekata] = useState([])
  const [drzave, setDrzave] = useState([])
  const [gradovi, setGradovi] = useState([])
  const [opstine, setOpstine] = useState([])
  const [lokacije, setLokacije] = useState([])
  const [ulice, setUlice] = useState([])
  const [grejanja, setGrejanja] = useState([])
  const [investitori, setInvestitori] = useState([])
  
  // Autocomplete za ulice
  const [ulicaSearchTerm, setUlicaSearchTerm] = useState('')
  const [filteredUlice, setFilteredUlice] = useState([])
  const [showUlicaDropdown, setShowUlicaDropdown] = useState(false)
  const [sveUliceSaRelacijama, setSveUliceSaRelacijama] = useState([])

  // Selektovana vrsta objekta
  const [selectedVrstaObjekta, setSelectedVrstaObjekta] = useState(null)
  
  // State za mapu
  const [showMapModal, setShowMapModal] = useState(false)

  // State za pretragu telefona (mora biti pre useEffect-a koji ga koristi)
  const [phoneSearchResults, setPhoneSearchResults] = useState([])
  const [isSearchingPhone, setIsSearchingPhone] = useState(false)
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false)
  const phoneInputRef = useRef(null)

  useEffect(() => {
    loadLookupData()
    loadSveUliceSaRelacijama() // Učitaj sve ulice sa relacijama za autocomplete
  }, [])

  // Zatvori phone dropdown kada se klikne van njega
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (phoneInputRef.current && !phoneInputRef.current.contains(event.target) && 
          !event.target.closest('[data-phone-dropdown]')) {
        setShowPhoneDropdown(false)
      }
    }
    
    if (showPhoneDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPhoneDropdown])
  
  // Zatvori dropdown kada se klikne van njega
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
  
  // Uklonjen useEffect koji je resetovao ulicaSearchTerm
  // Input polje za ulicu ostaje prazno nakon selektovanja (koristi se samo za pretragu)
  // Odabrana ulica se prikazuje u polju Lokalitet
  
  useEffect(() => {
    // Filtriraj ulice na osnovu search term-a
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
    
    setFilteredUlice(filtered.slice(0, 10)) // Maksimum 10 rezultata
    setShowUlicaDropdown(filtered.length > 0)
  }, [ulicaSearchTerm, sveUliceSaRelacijama])

  useEffect(() => {
    if (formData.idvrstaobjekta) {
      const vrsta = vrsteObjekata.find(v => v.id === parseInt(formData.idvrstaobjekta))
      setSelectedVrstaObjekta(vrsta)
    } else {
      setSelectedVrstaObjekta(null)
    }
  }, [formData.idvrstaobjekta, vrsteObjekata])

  // Ref za praćenje da li je selektovanje ulice u toku (da ne resetujemo useEffect-ovima)
  const isSelectingUlicaRef = useRef(false)
  // Ref za fokusiranje na polje Broj ulice nakon selektovanja ulice
  const brojUliceInputRef = useRef(null)

  useEffect(() => {
    // Ne resetuj ako je u toku selektovanje ulice
    if (isSelectingUlicaRef.current) return
    
    if (formData.iddrzava) {
      // Resetuj zavisne dropdown-ove
      setFormData(prev => ({
        ...prev,
        idgrada: '',
        idopstina: '',
        idlokacija: '',
        idulica: ''
      }))
      setOpstine([])
      setLokacije([])
      setUlice([])
      // Učitaj gradove
      loadGradovi(parseInt(formData.iddrzava))
    } else {
      setGradovi([])
      setOpstine([])
      setLokacije([])
      setUlice([])
    }
  }, [formData.iddrzava])

  useEffect(() => {
    // Ne resetuj ako je u toku selektovanje ulice
    if (isSelectingUlicaRef.current) return
    
    if (formData.idgrada) {
      loadOpstine(parseInt(formData.idgrada))
      // Resetuj zavisne dropdown-ove
      setFormData(prev => ({
        ...prev,
        idopstina: '',
        idlokacija: '',
        idulica: ''
      }))
      setOpstine([])
      setLokacije([])
      setUlice([])
    } else {
      setOpstine([])
      setLokacije([])
      setUlice([])
    }
  }, [formData.idgrada])

  useEffect(() => {
    // Ne resetuj ako je u toku selektovanje ulice
    if (isSelectingUlicaRef.current) return
    
    if (formData.idopstina) {
      loadLokacije(parseInt(formData.idopstina))
      // Resetuj zavisne dropdown-ove
      setFormData(prev => ({
        ...prev,
        idlokacija: '',
        idulica: ''
      }))
      setLokacije([])
      setUlice([])
    } else {
      setLokacije([])
      setUlice([])
    }
  }, [formData.idopstina])

  useEffect(() => {
    // Ne resetuj ako je u toku selektovanje ulice
    if (isSelectingUlicaRef.current) return
    
    if (formData.idlokacija) {
      loadUlice(parseInt(formData.idlokacija))
      // Resetuj zavisne dropdown-ove
      setFormData(prev => ({
        ...prev,
        idulica: ''
      }))
      setUlice([])
    } else {
      setUlice([])
    }
  }, [formData.idlokacija])

  const loadLookupData = async () => {
    try {
      const [
        { data: vrsteData },
        { data: drzaveData },
        { data: grejanjaData },
        { data: investitoriData, error: investitoriError }
      ] = await Promise.all([
        supabase.from('vrstaobjekta').select('*').order('opis'),
        supabase.from('drzava').select('*').order('opis'),
        supabase.from('grejanje').select('*').order('opis'),
        supabase.from('investitor').select('*').order('naziv')
      ])

      // Ako ima grešku sa investitor tabelom, loguj je ali ne prekidaj učitavanje
      if (investitoriError) {
        console.warn('⚠️ Greška pri učitavanju investitora (možda RLS problem):', investitoriError)
        console.warn('Investitori error details:', JSON.stringify(investitoriError, null, 2))
      }

      console.log('📊 Učitani investitori:', investitoriData)
      setVrsteObjekata(vrsteData || [])
      setDrzave(drzaveData || [])
      setGrejanja(grejanjaData || [])
      setInvestitori(investitoriData || []) // Može biti prazan array ako ima RLS problem
    } catch (error) {
      console.error('Greška pri učitavanju lookup podataka:', error)
    }
  }

  const loadGradovi = async (iddrzava) => {
    try {
      if (!iddrzava) {
        setGradovi([])
        return
      }
      
      const drzavaId = parseInt(iddrzava)
      console.log('🔍 Učitavanje gradova za državu ID:', drzavaId)
      
      // Učitaj gradove gde je iddrzave jednak sa selektovanom državom
      // Kolona se zove iddrzave (genitiv), ne iddrzava!
      const { data, error } = await supabase
        .from('grad')
        .select('id, opis, iddrzave')
        .eq('iddrzave', drzavaId)
        .order('opis')
      
      if (error) {
        console.error('❌ Greška pri učitavanju gradova:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        setGradovi([])
        return
      }
      
      console.log('✅ Učitani gradovi za državu', drzavaId, ':', data)
      setGradovi(data || [])
    } catch (error) {
      console.error('❌ Greška pri učitavanju gradova:', error)
      setGradovi([])
    }
  }

  const loadOpstine = async (idgrada) => {
    try {
      if (!idgrada) {
        setOpstine([])
        return
      }
      const { data, error } = await supabase
        .from('opstina')
        .select('*')
        .eq('idgrad', parseInt(idgrada))
        .order('opis')
      
      if (error) {
        console.error('Greška pri učitavanju opština:', error)
        setOpstine([])
        return
      }
      
      setOpstine(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju opština:', error)
      setOpstine([])
    }
  }

  const loadLokacije = async (idopstina) => {
    try {
      if (!idopstina) {
        setLokacije([])
        return
      }
      const { data, error } = await supabase
        .from('lokacija')
        .select('*')
        .eq('idopstina', parseInt(idopstina))
        .order('opis')
      
      if (error) {
        console.error('Greška pri učitavanju lokacija:', error)
        setLokacije([])
        return
      }
      
      setLokacije(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju lokacija:', error)
      setLokacije([])
    }
  }

  const loadUlice = async (idlokacija) => {
    try {
      if (!idlokacija) {
        setUlice([])
        return
      }
      const { data, error } = await supabase
        .from('ulica')
        .select('*')
        .eq('idlokacija', parseInt(idlokacija))
        .order('opis')
      
      if (error) {
        console.error('Greška pri učitavanju ulica:', error)
        setUlice([])
        return
      }
      
      setUlice(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju ulica:', error)
      setUlice([])
    }
  }

  // Učitaj sve ulice sa relacijama za autocomplete
  const loadSveUliceSaRelacijama = async () => {
    try {
      const { data, error } = await supabase
        .from('ulica')
        .select(`
          id,
          opis,
          idlokacija,
          lokacija:lokacija!ulica_idlokacija_fkey (
            id,
            opis,
            idopstina,
            opstina:opstina!lokacija_idopstina_fkey (
              id,
              opis,
              idgrad,
              grad:grad!opstina_idgrad_fkey (
                id,
                opis,
                iddrzave,
                drzava:drzava!grad_iddrzave_fkey (
                  id,
                  opis
                )
              )
            )
          )
        `)
        .order('opis')
      
      if (error) {
        console.error('Greška pri učitavanju ulica sa relacijama:', error)
        setSveUliceSaRelacijama([])
        return
      }
      
      // Transformiši podatke za lakši pristup
      const transformedData = (data || []).map(ulica => {
        const lokacija = ulica.lokacija
        const opstina = lokacija?.opstina
        const grad = opstina?.grad
        const drzava = grad?.drzava
        
        return {
          id: ulica.id,
          opis: ulica.opis,
          idlokacija: ulica.idlokacija,
          lokacija: lokacija ? {
            id: lokacija.id,
            opis: lokacija.opis,
            idopstina: lokacija.idopstina,
            opstina: opstina ? {
              id: opstina.id,
              opis: opstina.opis,
              idgrad: opstina.idgrad,
              grad: grad ? {
                id: grad.id,
                opis: grad.opis,
                iddrzave: grad.iddrzave,
                drzava: drzava
              } : null
            } : null
          } : null
        }
      })
      
      console.log('🛣️ Učitane ulice sa relacijama:', transformedData.length, 'ulica')
      if (transformedData.length > 0) {
        console.log('🛣️ Prva ulica kao primer:', transformedData[0])
      }
      
      setSveUliceSaRelacijama(transformedData)
    } catch (error) {
      console.error('Greška pri učitavanju ulica sa relacijama:', error)
      setSveUliceSaRelacijama([])
    }
  }

  // Handler za odabir ulice iz autocomplete-a
  const handleUlicaSelect = (ulica) => {
    console.log('🛣️ handleUlicaSelect pozvan sa ulicom:', ulica)
    
    if (!ulica) {
      console.error('❌ Ulica nije definisana')
      return
    }
    
    if (!ulica.lokacija) {
      console.error('❌ Ulica nema lokaciju:', ulica)
      return
    }
    
    const lokacija = ulica.lokacija
    const opstina = lokacija?.opstina
    const grad = opstina?.grad
    const drzava = grad?.drzava
    
    console.log('🛣️ Relacije:', {
      ulica: ulica.opis,
      lokacija: lokacija?.opis,
      opstina: opstina?.opis,
      grad: grad?.opis,
      drzava: drzava?.opis
    })
    
    // Zatvori dropdown PRVO
    setShowUlicaDropdown(false)
    
    // Očisti input polje za pretragu (ostaje prazno)
    setUlicaSearchTerm('')
    
    // Postavi flag da je u toku selektovanje (spreči useEffect-ove da resetuju)
    isSelectingUlicaRef.current = true
    
    // Popuni sva polja - brojulice ostaje isti ako već postoji
    setFormData(prev => ({
      ...prev,
      iddrzava: drzava?.id?.toString() || '',
      idgrada: grad?.id?.toString() || '',
      idopstina: opstina?.id?.toString() || '',
      idlokacija: lokacija?.id?.toString() || '',
      idulica: ulica.id.toString()
      // brojulice ostaje isti ako već postoji - ne resetuj ga
    }))
    
    // Učitaj zavisne podatke ako treba (da bi state-ovi bili popunjeni)
    // Ovo se poziva da bi state-ovi gradovi, opstine, lokacije bili popunjeni
    if (drzava?.id) {
      loadGradovi(drzava.id)
    }
    if (grad?.id) {
      loadOpstine(grad.id)
    }
    if (opstina?.id) {
      loadLokacije(opstina.id)
    }
    
    // Resetuj flag nakon što se useEffect-ovi izvrše (React će ih izvršiti u sledećem render ciklusu)
    setTimeout(() => {
      isSelectingUlicaRef.current = false
    }, 200)
  }

  // Funkcija za primenu nasumičnog pomeranja koordinata (100-500m) za zaštitu privatnosti
  const applyPrivacyOffset = (lat, lng) => {
    // Random ugao (0-360 stepeni)
    const angle = Math.random() * 2 * Math.PI
    // Random rastojanje (100-500 metara)
    const distance = 100 + Math.random() * 400
    
    // Konverzija metara u stepene (približno)
    // 1 stepen latitude ≈ 111,320 metara
    // 1 stepen longitude ≈ 111,320 * cos(latitude) metara
    const latOffset = (distance * Math.cos(angle)) / 111320
    const lngOffset = (distance * Math.sin(angle)) / (111320 * Math.cos(lat * Math.PI / 180))
    
    return {
      lat: parseFloat(lat) + latOffset,
      lng: parseFloat(lng) + lngOffset
    }
  }
  
  // Funkcija za automatsko prikazivanje lokacije na mapi
  const handleShowLocationOnMap = () => {
    // Otvori modal - PropertyMap će se pobrinuti za geokodiranje
    setShowMapModal(true)
  }
  
  // Pripremi address objekat za PropertyMap
  const getAddressForMap = () => {
    if (!formData.idulica) {
      return { drzava: '', grad: '', opstina: '', ulica: '', broj: '' }
    }
    
    const selectedUlica = sveUliceSaRelacijama.find(u => u.id === parseInt(formData.idulica))
    if (!selectedUlica || !selectedUlica.lokacija) {
      return { drzava: '', grad: '', opstina: '', ulica: '', broj: '' }
    }
    
    const lokacija = selectedUlica.lokacija
    const opstina = lokacija?.opstina
    const grad = opstina?.grad
    const drzava = grad?.drzava
    
    return {
      drzava: drzava?.opis || '',
      grad: grad?.opis || '',
      opstina: opstina?.opis || '',
      ulica: selectedUlica.opis || '',
      broj: formData.brojulice || ''
    }
  }
  
  // Handler za promenu lokacije sa mape
  // Ako postoji 'address' u callback-u, znači da je korisnik ručno kliknuo na mapu - primeni offset
  // Ako nema 'address', znači da je geokodiranje adrese - ne primenjuj offset
  const handleMapLocationChange = ({ lat, lng, address }) => {
    if (address) {
      // Korisnik je ručno kliknuo na mapu - primeni privacy offset
      const offsetCoords = applyPrivacyOffset(lat, lng)
      handleFieldChange('latitude', offsetCoords.lat.toFixed(7))
      handleFieldChange('longitude', offsetCoords.lng.toFixed(7))
    } else {
      // Geokodiranje adrese - koristi tačne koordinate bez offset-a
      handleFieldChange('latitude', lat.toFixed(7))
      handleFieldChange('longitude', lng.toFixed(7))
    }
  }

  const getVisibleFields = () => {
    const allFields = FIELD_DEFINITIONS.all || []
    if (!selectedVrstaObjekta) return allFields
    
    const vrstaKey = getVrstaObjektaKey(selectedVrstaObjekta.opis)
    const specificFields = FIELD_DEFINITIONS[vrstaKey] || []
    
    return [...allFields, ...specificFields]
  }

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleDetaljiChange = (section, key, value) => {
    setDetalji(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  // Formatiranje cene sa zarezom na tri mesta
  const formatCena = (value) => {
    if (!value) return ''
    // Ukloni sve što nije broj ili tačka
    const cleaned = value.toString().replace(/[^\d.]/g, '')
    const parts = cleaned.split('.')
    const integerPart = parts[0] || '0'
    const decimalPart = parts[1] || ''
    
    // Formatiraj integer deo sa zarezom na tri mesta
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    
    // Vrati sa decimalnim delom (maksimum 3 decimale)
    return decimalPart ? `${formattedInteger}.${decimalPart.substring(0, 3)}` : formattedInteger
  }

  // Parsiranje formatirane cene nazad u broj
  const parseCena = (formattedValue) => {
    if (!formattedValue) return ''
    // Ukloni zareze i zadrži samo brojeve i tačku
    return formattedValue.toString().replace(/,/g, '')
  }

  // Formatiranje datuma iz yyyy-mm-dd u dd.mm.yyyy
  const formatDatum = (dateString) => {
    if (!dateString) return ''
    // Ako je već u formatu dd.mm.yyyy, vrati kao jeste
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
      return dateString
    }
    // Ako je u formatu yyyy-mm-dd, konvertuj
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-')
      return `${day}.${month}.${year}`
    }
    return dateString
  }

  // Parsiranje datuma iz dd.mm.yyyy u yyyy-mm-dd (za čuvanje)
  const parseDatum = (formattedDate) => {
    if (!formattedDate) return ''
    // Ako je već u formatu yyyy-mm-dd, vrati kao jeste
    if (/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      return formattedDate
    }
    // Ako je u formatu dd.mm.yyyy, konvertuj
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(formattedDate)) {
      const [day, month, year] = formattedDate.split('.')
      return `${year}-${month}-${day}`
    }
    return formattedDate
  }

  // Validacija i maska za unos datuma dd.mm.yyyy
  const handleDatumInput = (value, onChangeCallback) => {
    // Dozvoli samo brojeve i tačke
    const cleaned = value.replace(/[^\d.]/g, '')
    
    // Ograniči dužinu
    if (cleaned.length > 10) return
    
    // Automatski dodaj tačke
    let formatted = cleaned
    if (cleaned.length >= 2 && cleaned[2] !== '.') {
      formatted = cleaned.slice(0, 2) + '.' + cleaned.slice(2)
    }
    if (formatted.length >= 5 && formatted[5] !== '.') {
      formatted = formatted.slice(0, 5) + '.' + formatted.slice(5)
    }
    
    onChangeCallback(formatted)
  }

  // Formatiranje međunarodnog telefona (+381 XX XXX XXXX)
  const formatPhone = (value) => {
    if (!value) return ''
    
    // Ukloni sve što nije broj ili +
    let cleaned = value.replace(/[^\d+]/g, '')
    
    // Ako ne počinje sa +, dodaj +381 ako je srpski broj
    if (!cleaned.startsWith('+')) {
      // Ako počinje sa 0, zameni sa +381
      if (cleaned.startsWith('0')) {
        cleaned = '+381' + cleaned.slice(1)
      } else if (cleaned.startsWith('381')) {
        cleaned = '+' + cleaned
      } else if (cleaned.length > 0 && !cleaned.startsWith('+')) {
        // Ako je samo lokalni broj, dodaj +381
        cleaned = '+381' + cleaned
      }
    }
    
    // Formatiraj: +381 XX XXX XXXX
    if (cleaned.startsWith('+381')) {
      const digits = cleaned.slice(4).replace(/\D/g, '')
      if (digits.length === 0) return '+381'
      if (digits.length <= 2) return `+381 ${digits}`
      if (digits.length <= 5) return `+381 ${digits.slice(0, 2)} ${digits.slice(2)}`
      return `+381 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`
    }
    
    // Za druge međunarodne formate, samo dodaj razmake
    if (cleaned.startsWith('+')) {
      const digits = cleaned.slice(1).replace(/\D/g, '')
      return '+' + digits
    }
    
    return cleaned
  }

  // Normalizacija telefona za pretragu (ukloni razmake, crtice, +)
  const normalizePhone = (phone) => {
    if (!phone) return ''
    // Ukloni sve što nije broj
    return phone.replace(/[^\d]/g, '')
  }

  // Pretraga ponuda po telefonu
  const searchPonudaByPhone = async (phone) => {
    if (!phone || phone.length < 3) {
      console.log('📞 Phone search: Phone too short or empty')
      setPhoneSearchResults([])
      setShowPhoneDropdown(false)
      return
    }

    setIsSearchingPhone(true)
    try {
      const normalizedPhone = normalizePhone(phone)
      console.log('📞 Phone search: Searching for normalized phone:', normalizedPhone, 'Original:', phone)
      
      // Generiši različite varijante telefona za pretragu
      const variants = []
      
      // 1. Originalni normalizovani (npr. 381638676663)
      variants.push(`%${normalizedPhone}%`)
      
      // 2. Bez 381 na početku (npr. 638676663)
      if (normalizedPhone.startsWith('381') && normalizedPhone.length > 3) {
        const without381 = normalizedPhone.slice(3)
        variants.push(`%${without381}%`)
        // 3. Sa 0 na početku (npr. 0638676663)
        variants.push(`%0${without381}%`)
      }
      
      // 4. Sa + na početku (npr. +381638676663)
      variants.push(`%+${normalizedPhone}%`)
      
      // 5. Sa razmacima (npr. +381 63 867 6663)
      if (normalizedPhone.startsWith('381') && normalizedPhone.length > 3) {
        const digits = normalizedPhone.slice(3)
        if (digits.length >= 9) {
          const formatted = `+381 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
          variants.push(`%${formatted}%`)
        }
      }
      
      console.log('📞 Phone search: Using patterns:', variants)
      
      // Izvrši više query-ja paralelno sa različitim pattern-ima
      const queries = variants.map(pattern => 
        supabase
          .from('ponuda')
          .select('id, naslovaoglasa, cena, brojtelefona_linija, brojulice, idvrstaobjekta, iddrzava, idgrada, idopstina, idlokacija, idulica')
          .ilike('brojtelefona_linija', pattern)
          .limit(10)
      )
      
      const results = await Promise.all(queries)
      
      // Kombinuj rezultate i ukloni duplikate po ID-u
      const allPonude = []
      const seenIds = new Set()
      
      for (const result of results) {
        if (result.error) {
          console.error('📞 Phone search error in one query:', result.error)
          continue
        }
        if (result.data) {
          for (const ponuda of result.data) {
            if (!seenIds.has(ponuda.id)) {
              seenIds.add(ponuda.id)
              allPonude.push(ponuda)
            }
          }
        }
      }
      
      const ponudeData = allPonude.slice(0, 10) // Limitiraj na 10 rezultata
      const error = results.find(r => r.error)?.error || null

      if (error) {
        console.error('📞 Phone search error:', error)
        setPhoneSearchResults([])
        setShowPhoneDropdown(false)
        return
      }

      console.log('📞 Phone search results:', ponudeData?.length || 0, 'ponuda found')

      if (!ponudeData || ponudeData.length === 0) {
        console.log('📞 Phone search: No results found')
        setPhoneSearchResults([])
        setShowPhoneDropdown(false)
        return
      }

      // Učitaj relacione podatke odvojeno
      const vrstaIds = [...new Set(ponudeData.map(p => p.idvrstaobjekta).filter(Boolean))]
      const drzavaIds = [...new Set(ponudeData.map(p => p.iddrzava).filter(Boolean))]
      const gradIds = [...new Set(ponudeData.map(p => p.idgrada).filter(Boolean))]
      const opstinaIds = [...new Set(ponudeData.map(p => p.idopstina).filter(Boolean))]
      const lokacijaIds = [...new Set(ponudeData.map(p => p.idlokacija).filter(Boolean))]
      const ulicaIds = [...new Set(ponudeData.map(p => p.idulica).filter(Boolean))]

      const [vrsteResult, drzaveResult, gradoviResult, opstineResult, lokacijeResult, uliceResult] = await Promise.all([
        vrstaIds.length > 0 ? supabase.from('vrstaobjekta').select('id, opis').in('id', vrstaIds) : Promise.resolve({ data: [] }),
        drzavaIds.length > 0 ? supabase.from('drzava').select('id, opis').in('id', drzavaIds) : Promise.resolve({ data: [] }),
        gradIds.length > 0 ? supabase.from('grad').select('id, opis').in('id', gradIds) : Promise.resolve({ data: [] }),
        opstinaIds.length > 0 ? supabase.from('opstina').select('id, opis').in('id', opstinaIds) : Promise.resolve({ data: [] }),
        lokacijaIds.length > 0 ? supabase.from('lokacija').select('id, opis').in('id', lokacijaIds) : Promise.resolve({ data: [] }),
        ulicaIds.length > 0 ? supabase.from('ulica').select('id, opis').in('id', ulicaIds) : Promise.resolve({ data: [] })
      ])

      // Kreiraj lookup mape
      const vrsteMap = new Map((vrsteResult.data || []).map(v => [v.id, v]))
      const drzaveMap = new Map((drzaveResult.data || []).map(d => [d.id, d]))
      const gradoviMap = new Map((gradoviResult.data || []).map(g => [g.id, g]))
      const opstineMap = new Map((opstineResult.data || []).map(o => [o.id, o]))
      const lokacijeMap = new Map((lokacijeResult.data || []).map(l => [l.id, l]))
      const uliceMap = new Map((uliceResult.data || []).map(u => [u.id, u]))

      // Mapiraj ponude sa relacijama
      const ponudeSaRelacijama = ponudeData.map(ponuda => ({
        ...ponuda,
        vrstaobjekta: ponuda.idvrstaobjekta ? vrsteMap.get(ponuda.idvrstaobjekta) || null : null,
        drzava: ponuda.iddrzava ? drzaveMap.get(ponuda.iddrzava) || null : null,
        grad: ponuda.idgrada ? gradoviMap.get(ponuda.idgrada) || null : null,
        opstina: ponuda.idopstina ? opstineMap.get(ponuda.idopstina) || null : null,
        lokacija: ponuda.idlokacija ? lokacijeMap.get(ponuda.idlokacija) || null : null,
        ulica: ponuda.idulica ? uliceMap.get(ponuda.idulica) || null : null
      }))

      console.log('📞 Phone search: Setting results:', ponudeSaRelacijama.length)
      setPhoneSearchResults(ponudeSaRelacijama)
      setShowPhoneDropdown(true)
    } catch (err) {
      console.error('Greška pri pretrazi:', err)
      setPhoneSearchResults([])
      setShowPhoneDropdown(false)
    } finally {
      setIsSearchingPhone(false)
    }
  }

  // Debounce ref za pretragu tokom unosa
  const phoneSearchDebounceRef = useRef(null)

  // Handler za promenu telefona
  const handlePhoneChange = (value) => {
    const formatted = formatPhone(value)
    handleFieldChange('brojtelefona_linija', formatted)
    
    // Debounced pretraga tokom unosa (nakon 1 sekunde)
    if (phoneSearchDebounceRef.current) {
      clearTimeout(phoneSearchDebounceRef.current)
    }
    
    phoneSearchDebounceRef.current = setTimeout(() => {
      if (formatted && formatted.length >= 3) {
        console.log('📞 Phone change: Triggering search after debounce')
        searchPonudaByPhone(formatted)
      }
    }, 1000)
  }

  // Handler za blur telefona (pretraga)
  const handlePhoneBlur = () => {
    console.log('📞 Phone blur triggered, phone value:', formData.brojtelefona_linija)
    if (formData.brojtelefona_linija) {
      searchPonudaByPhone(formData.brojtelefona_linija)
    } else {
      console.log('📞 Phone blur: No phone value, hiding dropdown')
      setPhoneSearchResults([])
      setShowPhoneDropdown(false)
    }
  }

  // Formatiranje adrese za prikaz
  const formatAddress = (ponuda) => {
    const parts = [
      ponuda.ulica?.opis,
      ponuda.brojulice,
      ponuda.lokacija?.opis,
      ponuda.opstina?.opis,
      ponuda.grad?.opis,
      ponuda.drzava?.opis
    ].filter(Boolean)
    return parts.join(', ') || 'N/A'
  }

  // Handler za promenu cene sa automatskom istorijom
  const handleCenaChange = (newCena) => {
    const parsedValue = parseCena(newCena)
    const parsedCena = parsedValue ? parseFloat(parsedValue) : null
    
    // Ako se cena promenila i prethodna cena postoji, dodaj u istoriju
    if (previousCenaRef.current !== null && previousCenaRef.current !== parsedCena && previousCenaRef.current > 0) {
      setMetapodaci(prev => ({
        ...prev,
        istorija_cene: [
          ...prev.istorija_cene,
          { datum: new Date().toISOString().split('T')[0], cena: previousCenaRef.current }
        ]
      }))
    }
    
    // Ažuriraj prethodnu cenu
    previousCenaRef.current = parsedCena
    
    // Ažuriraj formData sa parsiranom vrednošću (bez zareza)
    handleFieldChange('cena', parsedValue)
  }

  // State za formatirani prikaz cene
  const [formattedCena, setFormattedCena] = useState('')

  // Handler za formatiranje cene pri izlasku sa polja
  const handleCenaBlur = () => {
    if (formData.cena) {
      const parsed = parseCena(formData.cena)
      const formatted = formatCena(parsed)
      setFormattedCena(formatted)
      handleFieldChange('cena', parsed) // Sačuvaj parsiranu vrednost
      previousCenaRef.current = parsed ? parseFloat(parsed) : null
    } else {
      setFormattedCena('')
      previousCenaRef.current = null
    }
  }

  // Handleri za metapodaci
  const handleVlasnikChange = (index, field, value) => {
    setMetapodaci(prev => {
      const newVlasnici = [...prev.vlasnici]
      newVlasnici[index] = { ...newVlasnici[index], [field]: value }
      return { ...prev, vlasnici: newVlasnici }
    })
  }

  const addVlasnik = () => {
    setMetapodaci(prev => ({
      ...prev,
      vlasnici: [...prev.vlasnici, {
        ime: '', prezime: '', adresa: '', jmbg: '', email: '', tel: '',
        ident_isprava: '', lk: '', pib: '', id_drzava: '', sts_lice: '',
        poreklo_imovine: '', sumnja_pranje_novca: false, mesto_rodjenja: '',
        datum_rodjenja: '', sts_rezident: false, stvarnivlasnikstranke: false,
        datum_zadnje_provere: '', finalnakategorizacija: ''
      }]
    }))
  }

  const removeVlasnik = (index) => {
    if (metapodaci.vlasnici.length > 1) {
      setMetapodaci(prev => ({
        ...prev,
        vlasnici: prev.vlasnici.filter((_, i) => i !== index)
      }))
    }
  }

  const handleEopChange = (field, value) => {
    setMetapodaci(prev => ({
      ...prev,
      eop: { ...prev.eop, [field]: value }
    }))
  }

  const handleRealizacijaChange = (field, value) => {
    setMetapodaci(prev => ({
      ...prev,
      realizacija: { ...prev.realizacija, [field]: value }
    }))
  }

  const handleTroskoviChange = (field, value) => {
    setMetapodaci(prev => ({
      ...prev,
      troskovi: { ...prev.troskovi, [field]: parseFloat(value) || 0 }
    }))
  }

  const handleZastupnikChange = (field, value) => {
    setMetapodaci(prev => ({
      ...prev,
      zastupnik: { ...prev.zastupnik, [field]: value }
    }))
  }

  // Handleri za AI karakteristike
  const handleAiOpremljenostChange = (field, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      opremljenost: { ...prev.opremljenost, [field]: value }
    }))
  }

  const handleAiZivotniStilChange = (field, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      zivotni_stil: { ...prev.zivotni_stil, [field]: value }
    }))
  }

  const handleAiEkologijaChange = (field, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      ekologija: { ...prev.ekologija, [field]: value }
    }))
  }

  const handleAiBezbednostChange = (field, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      bezbednost: { ...prev.bezbednost, [field]: value }
    }))
  }

  const handleAiMikrolokacijaChange = (field, value) => {
    setAiKarakteristike(prev => ({
      ...prev,
      mikrolokacija: { ...prev.mikrolokacija, [field]: value }
    }))
  }

  const handlePogledToggle = (pogledValue) => {
    setAiKarakteristike(prev => {
      const currentPogled = Array.isArray(prev.ekologija.pogled) ? prev.ekologija.pogled : []
      const newPogled = currentPogled.includes(pogledValue)
        ? currentPogled.filter(p => p !== pogledValue)
        : [...currentPogled, pogledValue]
      return {
        ...prev,
        ekologija: { ...prev.ekologija, pogled: newPogled }
      }
    })
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  // Generisanje vektora iz opisa i detalja (za AI pretragu)
  const generateVector = async (text) => {
    // Ovo je placeholder - u produkciji bi pozvao AI servis za generisanje vektora
    // Za sada vraćamo null, ali struktura je spremna
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // DEBUG: Proveri da li se poziva slučajno
    console.log('🔴 handleSubmit pozvan!', {
      target: e.target,
      currentTarget: e.currentTarget,
      type: e.type,
      stack: new Error().stack
    })
    
    setError('')
    setLoading(true)

    try {
      if (!currentUser) {
        throw new Error('Korisnik nije prijavljen')
      }

      // Validacija
      if (!formData.idvrstaobjekta) {
        throw new Error('Vrsta objekta je obavezna')
      }
      if (!formData.naslovaoglasa) {
        throw new Error('Naslov oglasa je obavezan')
      }
      if (!formData.cena) {
        throw new Error('Cena je obavezna')
      }

      // Priprema osnovnih podataka
      const ponudaData = {
        datumkreiranja: new Date().toISOString(),
        datumpromene: new Date().toISOString(),
        idvrstaobjekta: parseInt(formData.idvrstaobjekta),
        idkorisnika: currentUser.id,
        datumprijema: formData.datumprijema || new Date().toISOString().split('T')[0],
        naslovaoglasa: formData.naslovaoglasa,
        kontaktosoba: formData.kontaktosoba || null,
        brojtelefona_linija: formData.brojtelefona_linija || null,
        cena: formData.cena ? parseFloat(formData.cena) : null,
        kvadratura: formData.kvadratura ? parseFloat(formData.kvadratura) : null,
        terasa: formData.terasa || null,
        kvadraturaizugovora: formData.kvadraturaizugovora ? parseFloat(formData.kvadraturaizugovora) : null,
        struktura: formData.struktura ? parseFloat(formData.struktura) : null,
        sprat: formData.sprat || null,
        spratstana: formData.spratstana ? parseInt(formData.spratstana) : null,
        spratnostzgrade: formData.spratnostzgrade ? parseInt(formData.spratnostzgrade) : null,
        idgrejanje: formData.idgrejanje ? parseInt(formData.idgrejanje) : null,
        idinvestitor: formData.idinvestitor ? parseInt(formData.idinvestitor) : null,
        godinagradnje: formData.godinagradnje || null,
        opis: formData.opis || null,
        internenapomene: formData.internenapomene || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        videolink: formData.videolink || null,
        stsaktivan: formData.stsaktivan,
        stsrentaprodaja: formData.stsrentaprodaja,
        // Checkbox polja
        ststelefon: formData.ststelefon,
        stslift: formData.stslift,
        stsuknjizen: formData.stsuknjizen,
        stspodrum: formData.stspodrum,
        ststoplavoda: formData.ststoplavoda,
        stsinterfon: formData.stsinterfon,
        stszasebno: formData.stszasebno,
        stsimagarazu: formData.stsimagarazu,
        stsimaparking: formData.stsimaparking,
        stsdvamokracvora: formData.stsdvamokracvora,
        stslegalizacija: formData.stslegalizacija,
        stszasticen: formData.stszasticen,
        stsuseljivost: formData.stsuseljivost || null,
        stsnovogradnja: formData.stsnovogradnja,
        stssalonac: formData.stssalonac,
        stsdupleks: formData.stsdupleks,
        stssivafaza: formData.stssivafaza,
        stsuizgradnji: formData.stsuizgradnji,
        stsekskluziva: formData.stsekskluziva,
        stshitnaprodaja: formData.stshitnaprodaja,
        stslux: formData.stslux,
        stszainvestiranje: formData.stszainvestiranje,
        stslodja: formData.stslodja,
        stsfb: formData.stsfb,
        // Dodatna polja
        ari: formData.ari ? parseFloat(formData.ari) : null,
        etaze: formData.etaze || null,
        opissekretarice: formData.opissekretarice || null,
        prostorije: formData.prostorije || null,
        dokumentacija: formData.dokumentacija || null,
        link: formData.link || null,
        vidljivostnasajtu: formData.vidljivostnasajtu || null,
        nivoenergetskeefikasnosti: formData.nivoenergetskeefikasnosti || null,
        '3dture': formData['3dture'] || null,
        stsvertikalahorizontala: formData.stsvertikalahorizontala,
      }

      // Lokacija podaci
      if (formData.iddrzava) ponudaData.iddrzava = parseInt(formData.iddrzava)
      if (formData.idgrada) ponudaData.idgrada = parseInt(formData.idgrada)
      if (formData.idopstina) ponudaData.idopstina = parseInt(formData.idopstina)
      if (formData.idlokacija) ponudaData.idlokacija = parseInt(formData.idlokacija)
      if (formData.idulica) ponudaData.idulica = parseInt(formData.idulica)
      if (formData.brojulice) ponudaData.brojulice = formData.brojulice.trim()

      // JSONB detalji - struktura
      const detaljiArray = []
      if (Object.keys(detalji.osnovne).length > 0) {
        detaljiArray.push({ sekcija: 'osnovne', podaci: detalji.osnovne })
      }
      if (Object.keys(detalji.tehnicke).length > 0) {
        detaljiArray.push({ sekcija: 'tehnicke', podaci: detalji.tehnicke })
      }
      if (Object.keys(detalji.opremljenost).length > 0) {
        detaljiArray.push({ sekcija: 'opremljenost', podaci: detalji.opremljenost })
      }
      if (Object.keys(detalji.ai).length > 0) {
        detaljiArray.push({ sekcija: 'ai', podaci: detalji.ai })
      }

      if (detaljiArray.length > 0) {
        ponudaData.detalji = detaljiArray
      }

      // JSONB metapodaci
      ponudaData.metapodaci = metapodaci

      // JSONB ai_karakteristike
      ponudaData.ai_karakteristike = aiKarakteristike

      // Generisanje vektora iz opisa i detalja
      const vectorText = [
        formData.naslovaoglasa,
        formData.opis,
        JSON.stringify(detalji),
        JSON.stringify(aiKarakteristike)
      ].filter(Boolean).join(' ')
      
      const vector = await generateVector(vectorText)
      if (vector) {
        ponudaData.vektor = vector
      }

      // Insert ponuda
      const { data: ponuda, error: ponudaError } = await supabase
        .from('ponuda')
        .insert([ponudaData])
        .select()
        .single()

      if (ponudaError) throw ponudaError

      // Upload fotografija
      if (photos.length > 0) {
        const photosData = await Promise.all(
          photos.map(async (photo) => {
            let url = photo.url
            
            // Ako je nova fotografija (ima file), konvertuj u base64 ili upload-uj
            if (photo.file) {
              url = await convertFileToBase64(photo.file)
            }

            return {
              datumpromene: new Date().toISOString(),
              idponude: ponuda.id,
              url: url,
            opis: photo.opis || null,
            redosled: photo.redosled || null,
            glavna: photo.glavna || false,
            stsskica: photo.stsskica || false,
            skica_segment: photo.skica_segment || null,
            skica_coords: photo.skica_coords || null
            }
          })
        )

        const { error: photosError } = await supabase
          .from('ponudafoto')
          .insert(photosData)

        if (photosError) throw photosError
      }

      // Zatvori formu i osveži listu samo nakon uspešnog čuvanja
      console.log('✅ Uspešno sačuvano, zatvaram formu...')
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Greška pri čuvanju ponude')
      console.error('Greška:', err)
    } finally {
      setLoading(false)
    }
  }

  const visibleFields = getVisibleFields()
  const fieldsBySection = {
    osnovne: visibleFields.filter(f => f.section === 'osnovne'),
    tehnicke: visibleFields.filter(f => f.section === 'tehnicke'),
    opremljenost: visibleFields.filter(f => f.section === 'opremljenost')
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        // Zatvori formu samo ako se klikne na backdrop (tamni deo), ne na formu
        if (e.target === e.currentTarget) {
          console.log('🖱️ Klik na backdrop, zatvaram formu')
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-auto max-h-[95vh] overflow-y-auto"
        onClick={(e) => {
          // Zaustavi propagaciju klikova unutar forme
          e.stopPropagation()
        }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Dodaj novu ponudu
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              console.log('❌ X dugme kliknuto, zatvaram formu')
              onClose()
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="p-4 sm:p-6 space-y-6"
          onClick={(e) => {
            // Spreči automatski submit forme kada se klikne na elemente unutar forme
            const target = e.target
            const isButton = target.tagName === 'BUTTON' && target.type === 'button'
            const isFileInput = target.type === 'file'
            const isPhotoUploadArea = target.closest('[data-photo-upload]')
            const isLabel = target.closest('label[for="photo-upload"]')
            
            if (isButton || isFileInput || isPhotoUploadArea || isLabel) {
              e.stopPropagation()
            }
          }}
          onKeyDown={(e) => {
            // Spreči submit na Enter key ako je fokus na PhotoUpload komponenti
            if (e.key === 'Enter' && e.target.closest('[data-photo-upload]')) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        >
          {/* Osnovne informacije */}
          <section className="border-b border-gray-200 pb-6">
            <button
              type="button"
              onClick={() => toggleSection('osnovne')}
              className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Osnovne informacije
              </h3>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.osnovne ? 'transform rotate-180' : ''}`} />
            </button>
            
            {openSections.osnovne && (
            <div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum prijema
                </label>
                <input
                  type="date"
                  value={formData.datumprijema || ''}
                  onChange={(e) => handleFieldChange('datumprijema', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vrsta objekta <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.idvrstaobjekta}
                  onChange={(e) => handleFieldChange('idvrstaobjekta', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Izaberite vrstu objekta</option>
                  {vrsteObjekata.map(vrsta => (
                    <option key={vrsta.id} value={vrsta.id}>{vrsta.opis}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.stsrentaprodaja}
                  onChange={(e) => handleFieldChange('stsrentaprodaja', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="prodaja">Prodaja</option>
                  <option value="renta">Renta</option>
                </select>
              </div>
            </div>

            {/* Lokalitet ispod Vrsta objekta, Ulica + Broj ulice + Latitude + Longitude ispod Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Lokalitet - read-only polje, ispod Vrsta objekta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokalitet
                </label>
                <input
                  type="text"
                  value={(() => {
                    // Koristi podatke direktno iz sveUliceSaRelacijama jer već ima sve relacije
                    if (formData.idulica && sveUliceSaRelacijama.length > 0) {
                      const selectedUlica = sveUliceSaRelacijama.find(u => u.id === parseInt(formData.idulica))
                      if (selectedUlica && selectedUlica.lokacija) {
                        const lokacija = selectedUlica.lokacija
                        const opstina = lokacija?.opstina
                        const grad = opstina?.grad
                        const drzava = grad?.drzava
                        
                        const lokalitetParts = [
                          drzava?.opis,
                          grad?.opis,
                          opstina?.opis,
                          lokacija?.opis,
                          selectedUlica.opis
                        ].filter(Boolean)
                        
                        return lokalitetParts.length > 0 ? lokalitetParts.join(', ') : ''
                      }
                    }
                    
                    // Fallback: ako lookup mapovi već imaju podatke, koristi ih
                    const lokalitetParts = [
                      drzave.find(d => d.id === parseInt(formData.iddrzava))?.opis,
                      gradovi.find(g => g.id === parseInt(formData.idgrada))?.opis,
                      opstine.find(o => o.id === parseInt(formData.idopstina))?.opis,
                      lokacije.find(l => l.id === parseInt(formData.idlokacija))?.opis,
                      formData.idulica ? sveUliceSaRelacijama.find(u => u.id === parseInt(formData.idulica))?.opis : null
                    ].filter(Boolean)
                    return lokalitetParts.length > 0 ? lokalitetParts.join(', ') : ''
                  })()}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Ulica + Broj ulice + Latitude + Longitude - desna strana (1/2 širine) */}
              <div className="grid grid-cols-2 gap-2">
                {/* Ulica - autocomplete za pretragu, ispod Status */}
                <div data-ulica-autocomplete>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ulica <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={ulicaSearchTerm}
                        onChange={(e) => {
                          const value = e.target.value
                          setUlicaSearchTerm(value)
                          
                          // Ako tekst ne odgovara nazivu odabrane ulice, resetuj odabir
                          if (formData.idulica && value.trim()) {
                            const selectedUlica = sveUliceSaRelacijama.find(u => u.id === parseInt(formData.idulica))
                            if (selectedUlica && value !== selectedUlica.opis && !value.startsWith(selectedUlica.opis)) {
                              // Korisnik menja tekst - resetuj odabir
                              setFormData(prev => ({ ...prev, idulica: '', brojulice: '' }))
                            }
                          }
                          
                          setShowUlicaDropdown(true)
                        }}
                        onFocus={() => {
                          if (filteredUlice.length > 0 || ulicaSearchTerm.trim() !== '') {
                            setShowUlicaDropdown(true)
                          }
                        }}
                        placeholder="Kucajte naziv ulice za pretragu..."
                        className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      {ulicaSearchTerm && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUlicaSearchTerm('')
                            setFormData(prev => ({
                              ...prev,
                              iddrzava: '',
                              idgrada: '',
                              idopstina: '',
                              idlokacija: '',
                              idulica: '',
                              brojulice: ''
                            }))
                            setShowUlicaDropdown(false)
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Dropdown sa rezultatima */}
                    {showUlicaDropdown && filteredUlice.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredUlice.map((ulica) => {
                          const lokacija = ulica.lokacija
                          const opstina = lokacija?.opstina
                          const grad = opstina?.grad
                          const drzava = grad?.drzava
                          const fullPath = [
                            drzava?.opis,
                            grad?.opis,
                            opstina?.opis,
                            lokacija?.opis,
                            ulica.opis
                          ].filter(Boolean).join(', ')
                          
                          return (
                            <button
                              key={ulica.id}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('🖱️ Klik na ulicu u dropdown-u:', ulica.opis)
                                handleUlicaSelect(ulica)
                                // Osiguraj zatvaranje dropdown-a
                                setShowUlicaDropdown(false)
                                // Fokusiraj na polje Broj ulice
                                setTimeout(() => {
                                  if (brojUliceInputRef.current) {
                                    brojUliceInputRef.current.focus()
                                  }
                                }, 100)
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="font-medium text-gray-900">{ulica.opis}</div>
                              {fullPath && (
                                <div className="text-sm text-gray-500 truncate">{fullPath}</div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Broj ulice, Latitude, Longitude - 3 polja, ukupna širina kao Ulica (1/2 desne strane) */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Broj ulice */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Broj ulice
                    </label>
                    <input
                      ref={brojUliceInputRef}
                      type="text"
                      id="brojulice-input"
                      value={formData.brojulice || ''}
                      onChange={(e) => handleFieldChange('brojulice', e.target.value)}
                      placeholder="npr. 15, 15A..."
                      disabled={!formData.idulica}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Latitude */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={formData.latitude || ''}
                      onChange={(e) => handleFieldChange('latitude', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  {/* Longitude */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.longitude || ''}
                        onChange={(e) => handleFieldChange('longitude', e.target.value)}
                        className="w-full pl-2 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleShowLocationOnMap}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 p-0.5"
                        title="Prikaži lokaciju na mapi"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

              {fieldsBySection.osnovne.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      required={field.required}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                      rows="3"
                    />
                  ) : field.key === 'cena' ? (
                    <input
                      type="text"
                      value={formattedCena || (formData.cena ? formatCena(formData.cena) : '')}
                      onChange={(e) => {
                        const parsed = parseCena(e.target.value)
                        handleCenaChange(parsed)
                        setFormattedCena(e.target.value) // Prikaži ono što korisnik kuca
                      }}
                      onBlur={handleCenaBlur}
                      onFocus={() => {
                        // Pri izlasku sa fokusa, prikaži formatiranu vrednost
                        if (formData.cena) {
                          setFormattedCena(formatCena(formData.cena))
                        }
                      }}
                      required={field.required}
                      placeholder="0.000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      required={field.required}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  )}
                </div>
              ))}
            </div>
            </div>
            )}
          </section>

          {/* Tehničke karakteristike */}
          {fieldsBySection.tehnicke.length > 0 && (
            <section className="border-b border-gray-200 pb-6">
              <button
                type="button"
                onClick={() => toggleSection('tehnicke')}
                className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Ruler className="w-5 h-5" />
                  Tehničke karakteristike
                </h3>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.tehnicke ? 'transform rotate-180' : ''}`} />
              </button>
              
              {openSections.tehnicke && (
              <div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldsBySection.tehnicke.map(field => {
                  // Generiši opcije za strukturu od 0.5 do 15.0 sa korakom 0.5
                  const strukturaOptions = []
                  if (field.key === 'struktura') {
                    for (let i = 0.5; i <= 15.0; i += 0.5) {
                      strukturaOptions.push(i.toFixed(1))
                    }
                  }

                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      {field.key === 'struktura' ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Izaberite strukturu</option>
                          {strukturaOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                          rows="3"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Izaberi</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={formData[field.key] || false}
                          onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              </div>
              )}
            </section>
          )}

          {/* Opremljenost */}
          {fieldsBySection.opremljenost.length > 0 && (
            <section className="border-b border-gray-200 pb-6">
              <button
                type="button"
                onClick={() => toggleSection('opremljenost')}
                className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Opremljenost
                </h3>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.opremljenost ? 'transform rotate-180' : ''}`} />
              </button>
              
              {openSections.opremljenost && (
              <div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fieldsBySection.opremljenost.map(field => {
                  // Sakrij brojtelefona_linija ako ststelefon nije čekiran
                  if (field.key === 'brojtelefona_linija' && !formData.ststelefon) {
                    return null
                  }
                  
                  return (
                    <div key={field.key} className="flex items-center">
                      {field.type === 'select' ? (
                        <>
                          <label htmlFor={field.key} className="mr-2 text-sm text-gray-700">
                            {field.label}:
                          </label>
                          <select
                            id={field.key}
                            value={formData[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Izaberi</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            id={field.key}
                            checked={formData[field.key] || false}
                            onChange={(e) => {
                              handleFieldChange(field.key, e.target.checked)
                              // Ako se isključi ststelefon, resetuj brojtelefona_linija
                              if (field.key === 'ststelefon' && !e.target.checked) {
                                handleFieldChange('brojtelefona_linija', '')
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <label htmlFor={field.key} className="ml-2 text-sm text-gray-700">
                            {field.label}
                          </label>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
              </div>
              )}
            </section>
          )}

          {/* Dodatna polja */}
          <section className="border-b border-gray-200 pb-6">
            <button
              type="button"
              onClick={() => toggleSection('dodatne')}
              className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800">Dodatne informacije</h3>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.dodatne ? 'transform rotate-180' : ''}`} />
            </button>
            
            {openSections.dodatne && (
            <div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kontakt osoba
                </label>
                <input
                  type="text"
                  value={formData.kontaktosoba || ''}
                  onChange={(e) => handleFieldChange('kontaktosoba', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Broj telefona
                </label>
                <div className="relative">
                  <input
                    ref={phoneInputRef}
                    type="text"
                    value={formData.brojtelefona_linija || ''}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    onFocus={() => {
                      if (phoneSearchResults.length > 0) {
                        setShowPhoneDropdown(true)
                      }
                    }}
                    placeholder="+381 XX XXX XXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {isSearchingPhone && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                </div>
                
                {/* Dropdown sa rezultatima pretrage */}
                {showPhoneDropdown && phoneSearchResults.length > 0 && (
                  <div data-phone-dropdown className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-2 text-xs font-semibold text-gray-600 border-b border-gray-200">
                      Pronađene ponude ({phoneSearchResults.length})
                    </div>
                    {phoneSearchResults.map((ponuda) => (
                      <div
                        key={ponuda.id}
                        className="p-3 hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          // Možeš dodati navigaciju ili otvaranje ponude ovde
                          console.log('Klik na ponudu:', ponuda.id)
                          setShowPhoneDropdown(false)
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {ponuda.vrstaobjekta?.opis || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {formatAddress(ponuda)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {ponuda.naslovaoglasa || 'Bez naslova'}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="font-semibold text-sm text-indigo-600">
                              {ponuda.cena 
                                ? new Intl.NumberFormat('sr-RS', {
                                    style: 'currency',
                                    currency: 'EUR',
                                    minimumFractionDigits: 0
                                  }).format(ponuda.cena)
                                : '-'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grejanje
                </label>
                <select
                  value={formData.idgrejanje}
                  onChange={(e) => handleFieldChange('idgrejanje', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Izaberite grejanje</option>
                  {grejanja.map(grejanje => (
                    <option key={grejanje.id} value={grejanje.id}>{grejanje.opis}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investitor
                </label>
                <select
                  value={formData.idinvestitor}
                  onChange={(e) => handleFieldChange('idinvestitor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Izaberite investitora</option>
                  {investitori.map(investitor => (
                    <option key={investitor.id} value={investitor.id}>{investitor.naziv}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Godina gradnje
                </label>
                <input
                  type="text"
                  value={formData.godinagradnje || ''}
                  onChange={(e) => handleFieldChange('godinagradnje', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video link
                </label>
                <input
                  type="text"
                  value={formData.videolink || ''}
                  onChange={(e) => handleFieldChange('videolink', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dokumentacija
                </label>
                <input
                  type="text"
                  value={formData.dokumentacija || ''}
                  onChange={(e) => handleFieldChange('dokumentacija', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link
                </label>
                <input
                  type="text"
                  value={formData.link || ''}
                  onChange={(e) => handleFieldChange('link', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vidljivost na sajtu
                </label>
                <input
                  type="text"
                  value={formData.vidljivostnasajtu || ''}
                  onChange={(e) => handleFieldChange('vidljivostnasajtu', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivo energetske efikasnosti
                </label>
                <input
                  type="text"
                  value={formData.nivoenergetskeefikasnosti || ''}
                  onChange={(e) => handleFieldChange('nivoenergetskeefikasnosti', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  3D ture
                </label>
                <input
                  type="text"
                  value={formData['3dture'] || ''}
                  onChange={(e) => handleFieldChange('3dture', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interne napomene
                </label>
                <textarea
                  value={formData.internenapomene || ''}
                  onChange={(e) => handleFieldChange('internenapomene', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                  rows="3"
                />
              </div>
            </div>
            </div>
            )}
          </section>

          {/* Status i dodatne opcije */}
          <section className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status i dodatne opcije</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stsnovogradnja"
                  checked={formData.stsnovogradnja || false}
                  onChange={(e) => handleFieldChange('stsnovogradnja', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="stsnovogradnja" className="ml-2 text-sm text-gray-700">
                  Novogradnja
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stssalonac"
                  checked={formData.stssalonac || false}
                  onChange={(e) => handleFieldChange('stssalonac', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="stssalonac" className="ml-2 text-sm text-gray-700">
                  Salonac
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stssivafaza"
                  checked={formData.stssivafaza || false}
                  onChange={(e) => handleFieldChange('stssivafaza', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="stssivafaza" className="ml-2 text-sm text-gray-700">
                  Siva faza
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stsuizgradnji"
                  checked={formData.stsuizgradnji || false}
                  onChange={(e) => handleFieldChange('stsuizgradnji', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="stsuizgradnji" className="ml-2 text-sm text-gray-700">
                  U izgradnji
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stsekskluziva"
                  checked={formData.stsekskluziva || false}
                  onChange={(e) => handleFieldChange('stsekskluziva', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="stsekskluziva" className="ml-2 text-sm text-gray-700">
                  Ekskluziva
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stshitnaprodaja"
                  checked={formData.stshitnaprodaja || false}
                  onChange={(e) => handleFieldChange('stshitnaprodaja', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="stshitnaprodaja" className="ml-2 text-sm text-gray-700">
                  Hitna prodaja
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stslux"
                  checked={formData.stslux || false}
                  onChange={(e) => handleFieldChange('stslux', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="stslux" className="ml-2 text-sm text-gray-700">
                  Lux
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stszainvestiranje"
                  checked={formData.stszainvestiranje || false}
                  onChange={(e) => handleFieldChange('stszainvestiranje', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="stszainvestiranje" className="ml-2 text-sm text-gray-700">
                  Za investiranje
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="stsvertikalahorizontala"
                  checked={formData.stsvertikalahorizontala || false}
                  onChange={(e) => handleFieldChange('stsvertikalahorizontala', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="stsvertikalahorizontala" className="ml-2 text-sm text-gray-700">
                  Vertikala/Horizontala
                </label>
              </div>
            </div>
          </section>

          {/* Fotografije */}
          <section className="border-b border-gray-200 pb-6">
            <button
              type="button"
              onClick={() => toggleSection('fotografije')}
              className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Fotografije
              </h3>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.fotografije ? 'transform rotate-180' : ''}`} />
            </button>
            
            {openSections.fotografije && (
            <div>
              <PhotoUpload
                photos={photos}
                setPhotos={setPhotos}
                onPhotosChange={setPhotos}
              />
            </div>
            )}
          </section>

          {/* METAPODACI - Tabovi */}
          <section className="border-b border-gray-200 pb-6">
            <button
              type="button"
              onClick={() => toggleSection('metapodaci')}
              className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Metapodaci i AI karakteristike
              </h3>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.metapodaci ? 'transform rotate-180' : ''}`} />
            </button>
            
            {openSections.metapodaci && (
            <div>

            {/* Tab navigacija */}
            <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200">
              {[
                { id: 'vlasnici', label: 'Vlasnici', icon: Users },
                { id: 'eop', label: 'EOP', icon: FileText },
                { id: 'troskovi', label: 'Troškovi', icon: Wallet },
                { id: 'ai', label: 'Karakteristike', icon: Brain },
                { id: 'zastupnik', label: 'Zastupnik', icon: UserCheck },
                { id: 'realizacija', label: 'Realizacija', icon: Receipt }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMetaTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeMetaTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab sadržaj */}
            <div className="bg-gray-50 rounded-lg p-4">
              {/* VLASNICI TAB */}
              {activeMetaTab === 'vlasnici' && (
                <div className="space-y-4">
                  {metapodaci.vlasnici.map((vlasnik, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-800">Vlasnik {index + 1}</h4>
                        {metapodaci.vlasnici.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVlasnik(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={vlasnik.ime}
                          onChange={(e) => handleVlasnikChange(index, 'ime', e.target.value)}
                          placeholder="Ime"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={vlasnik.prezime}
                          onChange={(e) => handleVlasnikChange(index, 'prezime', e.target.value)}
                          placeholder="Prezime"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={vlasnik.jmbg}
                          onChange={(e) => handleVlasnikChange(index, 'jmbg', e.target.value)}
                          placeholder="JMBG"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="email"
                          value={vlasnik.email}
                          onChange={(e) => handleVlasnikChange(index, 'email', e.target.value)}
                          placeholder="Email"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={vlasnik.tel}
                          onChange={(e) => handleVlasnikChange(index, 'tel', e.target.value)}
                          placeholder="Telefon"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={vlasnik.adresa}
                          onChange={(e) => handleVlasnikChange(index, 'adresa', e.target.value)}
                          placeholder="Adresa"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={vlasnik.lk}
                          onChange={(e) => handleVlasnikChange(index, 'lk', e.target.value)}
                          placeholder="Broj LK"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={vlasnik.pib}
                          onChange={(e) => handleVlasnikChange(index, 'pib', e.target.value)}
                          placeholder="PIB"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={vlasnik.mesto_rodjenja}
                          onChange={(e) => handleVlasnikChange(index, 'mesto_rodjenja', e.target.value)}
                          placeholder="Mesto rođenja"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Datum rođenja</label>
                          <input
                            type="date"
                            value={vlasnik.datum_rodjenja || ''}
                            onChange={(e) => {
                              const dateValue = e.target.value || ''
                              handleVlasnikChange(index, 'datum_rodjenja', dateValue)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <input
                          type="text"
                          value={vlasnik.poreklo_imovine}
                          onChange={(e) => handleVlasnikChange(index, 'poreklo_imovine', e.target.value)}
                          placeholder="Poreklo imovine"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <select
                          value={vlasnik.sts_lice}
                          onChange={(e) => handleVlasnikChange(index, 'sts_lice', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Status lica</option>
                          <option value="fizicko">Fizičko lice</option>
                          <option value="pravno">Pravno lice</option>
                          <option value="preduzetnik">Preduzetnik</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={vlasnik.sts_rezident}
                            onChange={(e) => handleVlasnikChange(index, 'sts_rezident', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          Rezident
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={vlasnik.stvarnivlasnikstranke}
                            onChange={(e) => handleVlasnikChange(index, 'stvarnivlasnikstranke', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          Stvarni vlasnik stranke
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={vlasnik.sumnja_pranje_novca}
                            onChange={(e) => handleVlasnikChange(index, 'sumnja_pranje_novca', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          Sumnja na pranje novca
                        </label>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addVlasnik}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj vlasnika
                  </button>
                </div>
              )}

              {/* EOP TAB */}
              {activeMetaTab === 'eop' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={metapodaci.eop.sts_ugovor_potpisan}
                      onChange={(e) => handleEopChange('sts_ugovor_potpisan', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Ugovor potpisan</span>
                  </label>
                  <div></div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Datum ugovora</label>
                    <input
                      type="date"
                      value={metapodaci.eop.datum_ugovora}
                      onChange={(e) => handleEopChange('datum_ugovora', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Datum isteka</label>
                    <input
                      type="date"
                      value={metapodaci.eop.datum_istice}
                      onChange={(e) => handleEopChange('datum_istice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Katastarska parcela</label>
                    <input
                      type="text"
                      value={metapodaci.eop.katastarska_parceka}
                      onChange={(e) => handleEopChange('katastarska_parceka', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Katastarska opština</label>
                    <input
                      type="text"
                      value={metapodaci.eop.kat_opstina}
                      onChange={(e) => handleEopChange('kat_opstina', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {/* REALIZACIJA TAB */}
              {activeMetaTab === 'realizacija' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={metapodaci.realizacija.zakljucen}
                      onChange={(e) => handleRealizacijaChange('zakljucen', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Zaključen</span>
                  </label>
                  <div></div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Datum zaključenja</label>
                    <input
                      type="date"
                      value={metapodaci.realizacija.datum_zakljucenja}
                      onChange={(e) => handleRealizacijaChange('datum_zakljucenja', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Kupoprodajna cena (€)</label>
                    <input
                      type="number"
                      value={metapodaci.realizacija.kupoprodajna_cena}
                      onChange={(e) => handleRealizacijaChange('kupoprodajna_cena', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Provizija (€)</label>
                    <input
                      type="number"
                      value={metapodaci.realizacija.provizija}
                      onChange={(e) => handleRealizacijaChange('provizija', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Namena transakcije</label>
                    <input
                      type="text"
                      value={metapodaci.realizacija.namena_transakcije}
                      onChange={(e) => handleRealizacijaChange('namena_transakcije', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Primedba</label>
                    <textarea
                      value={metapodaci.realizacija.primedba}
                      onChange={(e) => handleRealizacijaChange('primedba', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows="2"
                    />
                  </div>
                </div>
              )}

              {/* TROŠKOVI TAB */}
              {activeMetaTab === 'troskovi' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'infostan', label: 'Infostan' },
                    { key: 'kablovska', label: 'Kablovska' },
                    { key: 'struja', label: 'Struja' },
                    { key: 'telefon', label: 'Telefon' },
                    { key: 'internet', label: 'Internet' },
                    { key: 'odrzavanje', label: 'Održavanje' },
                    { key: 'ostalo', label: 'Ostalo' }
                  ].map(trosak => (
                    <div key={trosak.key}>
                      <label className="block text-sm text-gray-600 mb-1">{trosak.label} (€)</label>
                      <input
                        type="number"
                        value={metapodaci.troskovi[trosak.key]}
                        onChange={(e) => handleTroskoviChange(trosak.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ZASTUPNIK TAB */}
              {activeMetaTab === 'zastupnik' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Ime</label>
                    <input
                      type="text"
                      value={metapodaci.zastupnik.ime}
                      onChange={(e) => handleZastupnikChange('ime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Prezime</label>
                    <input
                      type="text"
                      value={metapodaci.zastupnik.prezime}
                      onChange={(e) => handleZastupnikChange('prezime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Adresa</label>
                    <input
                      type="text"
                      value={metapodaci.zastupnik.adresa}
                      onChange={(e) => handleZastupnikChange('adresa', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Opština</label>
                    <input
                      type="text"
                      value={metapodaci.zastupnik.opstina}
                      onChange={(e) => handleZastupnikChange('opstina', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Broj LK</label>
                    <input
                      type="text"
                      value={metapodaci.zastupnik.lk}
                      onChange={(e) => handleZastupnikChange('lk', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Datum</label>
                    <input
                      type="date"
                      value={metapodaci.zastupnik.datum}
                      onChange={(e) => handleZastupnikChange('datum', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Mesto</label>
                    <input
                      type="text"
                      value={metapodaci.zastupnik.mesto}
                      onChange={(e) => handleZastupnikChange('mesto', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {/* AI KARAKTERISTIKE TAB */}
              {activeMetaTab === 'ai' && (
                <div className="space-y-4">
                  {/* Grid sa karticama */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* KARTICA: Opremljenost */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">🏠</span>
                        Opremljenost
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { key: 'sts_internet', label: 'Internet', icon: '🌐' },
                          { key: 'sts_kablovska', label: 'Kablovska', icon: '📺' },
                          { key: 'sts_frizider', label: 'Frižider', icon: '🧊' },
                          { key: 'sts_sporet', label: 'Šporet', icon: '🍳' },
                          { key: 'sts_vesmasina', label: 'Veš mašina', icon: '🧺' },
                          { key: 'sts_tv', label: 'TV', icon: '📺' },
                          { key: 'klima', label: 'Klima', icon: '❄️' },
                          { key: 'sudomasina', label: 'Sudo mašina', icon: '🍽️' },
                          { key: 'sts_masina_sudje', label: 'Mašina suđe', icon: '🍽️' },
                          { key: 'sts_mikrotalasna', label: 'Mikrotalasna', icon: '📡' },
                          { key: 'sts_pegla', label: 'Pegla', icon: '👔' },
                          { key: 'sts_usisivac', label: 'Usisivač', icon: '🧹' },
                          { key: 'sts_fen', label: 'Fen', icon: '💇' },
                          { key: 'sts_grejalica', label: 'Grejalica', icon: '🔥' },
                          { key: 'sts_roletne', label: 'El. roletne', icon: '🪟' },
                          { key: 'sts_alarm', label: 'Alarm', icon: '🚨' },
                          { key: 'sts_video_nadzor', label: 'Video nadzor', icon: '📹' },
                          { key: 'sts_smart_home', label: 'Smart home', icon: '🏠' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-1.5 text-xs bg-white/60 hover:bg-white rounded-lg px-2 py-1.5 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={aiKarakteristike.opremljenost[item.key]}
                              onChange={(e) => handleAiOpremljenostChange(item.key, e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5"
                            />
                            <span>{item.icon}</span>
                            <span className="text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* KARTICA: Bezbednost */}
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                      <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs">🛡️</span>
                        Bezbednost
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'portir', label: 'Portir u zgradi', icon: '👮' },
                          { key: 'video_interfon', label: 'Video interfon', icon: '📹' },
                          { key: 'protivpozarni_sistem', label: 'Protivpožarni', icon: '🧯' },
                          { key: 'osigurana_zgrada', label: 'Osigurana zgrada', icon: '🏢' },
                          { key: 'sigurnosna_vrata', label: 'Sigurnosna vrata', icon: '🚪' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-1.5 text-xs bg-white/60 hover:bg-white rounded-lg px-2 py-1.5 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={aiKarakteristike.bezbednost[item.key]}
                              onChange={(e) => handleAiBezbednostChange(item.key, e.target.checked)}
                              className="rounded border-gray-300 text-red-600 w-3.5 h-3.5"
                            />
                            <span>{item.icon}</span>
                            <span className="text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* KARTICA: Životni stil */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs">🌿</span>
                        Životni stil
                      </h4>
                      
                      {/* Opcije */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <label className="flex items-center gap-1.5 text-xs bg-white/60 hover:bg-white rounded-lg px-2 py-1.5 cursor-pointer">
                          <input type="checkbox" checked={aiKarakteristike.zivotni_stil.rad_od_kuce} onChange={(e) => handleAiZivotniStilChange('rad_od_kuce', e.target.checked)} className="rounded border-gray-300 text-green-600 w-3.5 h-3.5" />
                          <span>💻</span><span className="text-gray-700">Rad od kuće</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs bg-white/60 hover:bg-white rounded-lg px-2 py-1.5 cursor-pointer">
                          <input type="checkbox" checked={aiKarakteristike.zivotni_stil.pusenje_dozvoljeno} onChange={(e) => handleAiZivotniStilChange('pusenje_dozvoljeno', e.target.checked)} className="rounded border-gray-300 text-green-600 w-3.5 h-3.5" />
                          <span>🚬</span><span className="text-gray-700">Pušenje OK</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs bg-white/60 hover:bg-white rounded-lg px-2 py-1.5 cursor-pointer">
                          <input type="checkbox" checked={aiKarakteristike.zivotni_stil.pogodan_za_decu} onChange={(e) => handleAiZivotniStilChange('pogodan_za_decu', e.target.checked)} className="rounded border-gray-300 text-green-600 w-3.5 h-3.5" />
                          <span>👶</span><span className="text-gray-700">Za decu</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs bg-white/60 hover:bg-white rounded-lg px-2 py-1.5 cursor-pointer">
                          <input type="checkbox" checked={aiKarakteristike.zivotni_stil.pogodan_za_studente} onChange={(e) => handleAiZivotniStilChange('pogodan_za_studente', e.target.checked)} className="rounded border-gray-300 text-green-600 w-3.5 h-3.5" />
                          <span>🎓</span><span className="text-gray-700">Za studente</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs bg-white/60 hover:bg-white rounded-lg px-2 py-1.5 cursor-pointer">
                          <input type="checkbox" checked={aiKarakteristike.zivotni_stil.pogodan_za_penzionere} onChange={(e) => handleAiZivotniStilChange('pogodan_za_penzionere', e.target.checked)} className="rounded border-gray-300 text-green-600 w-3.5 h-3.5" />
                          <span>👴</span><span className="text-gray-700">Za penzionere</span>
                        </label>
                      </div>

                      {/* Selecti */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">🐾 Pet-friendly</label>
                          <input type="number" min="0" max="5" value={aiKarakteristike.zivotni_stil.pet_friendly} onChange={(e) => handleAiZivotniStilChange('pet_friendly', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs" placeholder="0-5" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">🔊 Buka</label>
                          <select value={aiKarakteristike.zivotni_stil.nivo_buke} onChange={(e) => handleAiZivotniStilChange('nivo_buke', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs">
                            <option value="">-</option>
                            <option value="nisko">Nisko</option>
                            <option value="srednje">Srednje</option>
                            <option value="visoko">Visoko</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">☀️ Sunce</label>
                          <select value={aiKarakteristike.zivotni_stil.osuncanost} onChange={(e) => handleAiZivotniStilChange('osuncanost', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs">
                            <option value="">-</option>
                            <option value="slabo">Slabo</option>
                            <option value="srednje">Srednje</option>
                            <option value="dobro">Dobro</option>
                            <option value="odlicno">Odlično</option>
                          </select>
                        </div>
                      </div>

                      {/* Blizina */}
                      <div className="text-xs text-gray-500 mb-1">📍 Blizina (min pešice)</div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {[
                          { key: 'blizina_parka', label: '🌳' },
                          { key: 'blizina_teretane', label: '🏋️' },
                          { key: 'blizina_prodavnice', label: '🛒' },
                          { key: 'blizina_apoteke', label: '💊' },
                          { key: 'blizina_bolnice', label: '🏥' },
                          { key: 'blizina_autobuske', label: '🚌' }
                        ].map(item => (
                          <div key={item.key} className="text-center">
                            <div className="text-sm mb-0.5">{item.label}</div>
                            <input type="number" min="0" value={aiKarakteristike.zivotni_stil[item.key]} onChange={(e) => handleAiZivotniStilChange(item.key, parseInt(e.target.value) || 0)} className="w-full px-1 py-1 border border-gray-200 rounded text-xs text-center" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* KARTICA: Mikrolokacija */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
                      <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs">📍</span>
                        Mikrolokacija
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <label className="flex items-center gap-1.5 text-xs bg-white/60 hover:bg-white rounded-lg px-2 py-1.5 cursor-pointer">
                          <input type="checkbox" checked={aiKarakteristike.mikrolokacija.mirna_ulica} onChange={(e) => handleAiMikrolokacijaChange('mirna_ulica', e.target.checked)} className="rounded border-gray-300 text-purple-600 w-3.5 h-3.5" />
                          <span>🤫</span><span className="text-gray-700">Mirna ulica</span>
                        </label>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">🅿️ Parking zona</label>
                          <select value={aiKarakteristike.mikrolokacija.parking_zona} onChange={(e) => handleAiMikrolokacijaChange('parking_zona', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs">
                            <option value="">-</option>
                            <option value="1">Zona 1</option>
                            <option value="2">Zona 2</option>
                            <option value="3">Zona 3</option>
                            <option value="slobodna">Slobodna</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-1">🚶 Udaljenosti (min pešice)</div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {[
                          { key: 'skola_minuta', label: '🏫' },
                          { key: 'vrtic_minuta', label: '👶' },
                          { key: 'fakultet_minuta', label: '🎓' },
                          { key: 'metro_minuta', label: '🚇' },
                          { key: 'blizina_centra', label: '🏙️' },
                          { key: 'ev_punjac_metara', label: '⚡' }
                        ].map(item => (
                          <div key={item.key} className="text-center">
                            <div className="text-sm mb-0.5">{item.label}</div>
                            <input type="number" min="0" value={aiKarakteristike.mikrolokacija[item.key]} onChange={(e) => handleAiMikrolokacijaChange(item.key, parseInt(e.target.value) || 0)} className="w-full px-1 py-1 border border-gray-200 rounded text-xs text-center" />
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* KARTICA: Ekologija - full width */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                    <h4 className="font-semibold text-teal-800 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center text-white text-xs">🌍</span>
                      Ekologija & Energija
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Pogled */}
                      <div>
                        <div className="text-xs text-gray-600 mb-2">👁️ Pogled na</div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: 'park', label: '🌳 Park' },
                            { value: 'ulica', label: '🛣️ Ulica' },
                            { value: 'dvoriste', label: '🏡 Dvorište' },
                            { value: 'reka', label: '🌊 Reka' },
                            { value: 'panorama', label: '🌄 Panorama' }
                          ].map(option => {
                            const currentPogled = Array.isArray(aiKarakteristike.ekologija.pogled) ? aiKarakteristike.ekologija.pogled : []
                            const isChecked = currentPogled.includes(option.value)
                            return (
                              <label key={option.value} className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${isChecked ? 'bg-teal-600 text-white' : 'bg-white/60 hover:bg-white text-gray-700'}`}>
                                <input type="checkbox" checked={isChecked} onChange={() => handlePogledToggle(option.value)} className="hidden" />
                                {option.label}
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      {/* Selecti */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">💨 Kvalitet vazduha</label>
                          <select value={aiKarakteristike.ekologija.indeks_vazduha} onChange={(e) => handleAiEkologijaChange('indeks_vazduha', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs">
                            <option value="">-</option>
                            <option value="dobar">✅ Dobar</option>
                            <option value="srednji">⚠️ Srednji</option>
                            <option value="los">❌ Loš</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">⚡ Energetski razred</label>
                          <select value={aiKarakteristike.ekologija.energetski_razred} onChange={(e) => handleAiEkologijaChange('energetski_razred', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs">
                            <option value="">-</option>
                            <option value="A+">A+</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                            <option value="F">F</option>
                            <option value="G">G</option>
                          </select>
                        </div>
                      </div>

                      {/* Eko opcije */}
                      <div>
                        <div className="text-xs text-gray-600 mb-2">♻️ Eko karakteristike</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { key: 'solarni_paneli', label: '☀️ Solarni paneli' },
                            { key: 'toplotna_pumpa', label: '🌡️ Toplotna pumpa' },
                            { key: 'reciklaza', label: '♻️ Reciklaža' }
                          ].map(item => (
                            <label key={item.key} className="flex items-center gap-1 text-xs bg-white/60 hover:bg-white rounded-lg px-2 py-1 cursor-pointer">
                              <input type="checkbox" checked={aiKarakteristike.ekologija[item.key]} onChange={(e) => handleAiEkologijaChange(item.key, e.target.checked)} className="rounded border-gray-300 text-teal-600 w-3 h-3" />
                              <span className="text-gray-700">{item.label}</span>
                            </label>
                          ))}
                          <div className="flex items-center gap-1">
                            <span className="text-xs">🌿</span>
                            <input type="number" min="0" max="100" value={aiKarakteristike.ekologija.zelena_povrsina} onChange={(e) => handleAiEkologijaChange('zelena_povrsina', parseInt(e.target.value) || 0)} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs" placeholder="%" />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Istorija cene - prikazuje se ako ima zapisa */}
            {metapodaci.istorija_cene.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Istorija cene</h4>
                <div className="space-y-1">
                  {metapodaci.istorija_cene.map((zapis, index) => (
                    <div key={index} className="text-sm text-yellow-700">
                      {zapis.datum}: {zapis.cena?.toLocaleString('sr-RS')} €
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
            )}
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                console.log('🚫 Otkaži dugme kliknuto, zatvaram formu')
                onClose()
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Čuvanje...' : 'Sačuvaj ponudu'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Modal sa mapom */}
      {showMapModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMapModal(false)
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Izaberite lokaciju na mapi</h3>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 relative p-6" style={{ minHeight: '400px' }}>
              <PropertyMap
                address={getAddressForMap()}
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={handleMapLocationChange}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
