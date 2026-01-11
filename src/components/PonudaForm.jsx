import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { getCurrentUser } from '../utils/auth'
import PhotoUpload from './PhotoUpload'
import { Save, X, Upload, Building2, MapPin, DollarSign, Ruler, Info, Search, ChevronDown } from 'lucide-react'

// Definicija polja po vrstama objekata
const FIELD_DEFINITIONS = {
  // Polja koja se prikazuju za sve vrste objekata
  all: [
    { key: 'naslovaoglasa', label: 'Naslov oglasa', type: 'text', required: true, section: 'osnovne' },
    { key: 'cena', label: 'Cena (RSD)', type: 'number', required: true, section: 'osnovne' },
    { key: 'kvadratura', label: 'Kvadratura (m²)', type: 'number', section: 'osnovne' },
    { key: 'opis', label: 'Opis', type: 'textarea', section: 'osnovne' },
  ],
  // Polja specifična za određene vrste objekata
  stan: [
    { key: 'struktura', label: 'Struktura', type: 'number', section: 'tehnicke' },
    { key: 'spratstana', label: 'Sprat stana', type: 'number', section: 'tehnicke' },
    { key: 'spratnostzgrade', label: 'Spratnost zgrade', type: 'number', section: 'tehnicke' },
    { key: 'sprat', label: 'Sprat', type: 'text', section: 'tehnicke' },
    { key: 'stsuseljivost', label: 'Useljivost', type: 'checkbox', section: 'tehnicke' },
    { key: 'ststelefon', label: 'Telefon', type: 'checkbox', section: 'opremljenost' },
    { key: 'stslift', label: 'Lift', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsuknjizen', label: 'Uknižen', type: 'checkbox', section: 'opremljenost' },
    { key: 'stspodrum', label: 'Podrum', type: 'checkbox', section: 'opremljenost' },
    { key: 'ststoplavoda', label: 'Topla voda', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsinterfon', label: 'Interfon', type: 'checkbox', section: 'opremljenost' },
    { key: 'stszasebno', label: 'Zasebno', type: 'checkbox', section: 'opremljenost' },
    { key: 'tststerasa', label: 'Terasa', type: 'checkbox', section: 'opremljenost' },
    { key: 'stslodja', label: 'Lođa', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsfb', label: 'FB', type: 'checkbox', section: 'opremljenost' },
  ],
  plac: [
    { key: 'kvadraturaizugovora', label: 'Kvadratura iz ugovora (m²)', type: 'number', section: 'tehnicke' },
    { key: 'ari', label: 'ARI (m²)', type: 'number', section: 'tehnicke' },
    { key: 'stslegalizacija', label: 'Legalizacija', type: 'checkbox', section: 'tehnicke' },
    { key: 'stszasticen', label: 'Zaštićen', type: 'checkbox', section: 'tehnicke' },
  ],
  kuca: [
    { key: 'struktura', label: 'Struktura', type: 'number', section: 'tehnicke' },
    { key: 'spratnostzgrade', label: 'Spratnost', type: 'number', section: 'tehnicke' },
    { key: 'etaze', label: 'Etaže', type: 'text', section: 'tehnicke' },
    { key: 'stsuseljivost', label: 'Useljivost', type: 'checkbox', section: 'tehnicke' },
    { key: 'stspodrum', label: 'Podrum', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsimagarazu', label: 'Ima garažu', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsimaparking', label: 'Ima parking', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsdvamokracvora', label: 'Dva mokraćvora', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsdupleks', label: 'Dupleks', type: 'checkbox', section: 'opremljenost' },
    { key: 'tststerasa', label: 'Terasa', type: 'checkbox', section: 'opremljenost' },
  ],
  poslovni: [
    { key: 'struktura', label: 'Struktura', type: 'number', section: 'tehnicke' },
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
    naslovaoglasa: '',
    kontaktosoba: '',
    brojtelefona: '',
    kvadratura: '',
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
    stsuseljivost: false,
    stsnovogradnja: false,
    stssalonac: false,
    stsdupleks: false,
    stssivafaza: false,
    stsuizgradnji: false,
    stsekskluziva: false,
    stshitnaprodaja: false,
    stslux: false,
    stszainvestiranje: false,
    tststerasa: false,
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
    stsrazlogbrisanja: '',
    datumbrisanja: null,
  })

  // JSONB detalji
  const [detalji, setDetalji] = useState({
    osnovne: {},
    tehnicke: {},
    opremljenost: {},
    ai: {}
  })

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

  useEffect(() => {
    loadLookupData()
    loadSveUliceSaRelacijama() // Učitaj sve ulice sa relacijama za autocomplete
  }, [])
  
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
  
  // Postavi tekst odabrane ulice kada se promeni formData.idulica
  useEffect(() => {
    if (formData.idulica && sveUliceSaRelacijama.length > 0) {
      const selectedUlica = sveUliceSaRelacijama.find(u => u.id === parseInt(formData.idulica))
      if (selectedUlica && ulicaSearchTerm !== selectedUlica.opis) {
        setUlicaSearchTerm(selectedUlica.opis)
      }
    } else if (!formData.idulica && ulicaSearchTerm) {
      // Resetuj ako nije odabrana ulica
      setUlicaSearchTerm('')
    }
  }, [formData.idulica, sveUliceSaRelacijama])
  
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

  useEffect(() => {
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
        supabase.from('investitor').select('*').order('opis')
      ])

      // Ako ima grešku sa investitor tabelom, loguj je ali ne prekidaj učitavanje
      if (investitoriError) {
        console.warn('⚠️ Greška pri učitavanju investitora (možda RLS problem):', investitoriError)
      }

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
    
    // Popuni sva polja
    setFormData(prev => ({
      ...prev,
      iddrzava: drzava?.id?.toString() || '',
      idgrada: grad?.id?.toString() || '',
      idopstina: opstina?.id?.toString() || '',
      idlokacija: lokacija?.id?.toString() || '',
      idulica: ulica.id.toString()
    }))
    
    // Postavi tekst za prikaz - OVO JE VAŽNO
    console.log('🛣️ Postavljam ulicaSearchTerm na:', ulica.opis)
    setUlicaSearchTerm(ulica.opis)
    setShowUlicaDropdown(false)
    
    // Učitaj zavisne podatke ako treba
    if (drzava?.id) {
      loadGradovi(drzava.id)
    }
    if (grad?.id) {
      loadOpstine(grad.id)
    }
    if (opstina?.id) {
      loadLokacije(opstina.id)
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
        datumprijema: new Date().toISOString().split('T')[0],
        naslovaoglasa: formData.naslovaoglasa,
        kontaktosoba: formData.kontaktosoba || null,
        brojtelefona: formData.brojtelefona || null,
        cena: formData.cena ? parseFloat(formData.cena) : null,
        kvadratura: formData.kvadratura ? parseFloat(formData.kvadratura) : null,
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
        stsuseljivost: formData.stsuseljivost,
        stsnovogradnja: formData.stsnovogradnja,
        stssalonac: formData.stssalonac,
        stsdupleks: formData.stsdupleks,
        stssivafaza: formData.stssivafaza,
        stsuizgradnji: formData.stsuizgradnji,
        stsekskluziva: formData.stsekskluziva,
        stshitnaprodaja: formData.stshitnaprodaja,
        stslux: formData.stslux,
        stszainvestiranje: formData.stszainvestiranje,
        tststerasa: formData.tststerasa,
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
        stsrazlogbrisanja: formData.stsrazlogbrisanja || null,
        datumbrisanja: formData.datumbrisanja || null,
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

      // Generisanje vektora iz opisa i detalja
      const vectorText = [
        formData.naslovaoglasa,
        formData.opis,
        JSON.stringify(detalji)
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
              glavna: photo.glavna || false
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Osnovne informacije
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vrsta objekta *
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
                  Status *
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

              {/* Autocomplete za ulice - ovo automatski popunjava sva polja */}
              <div className="md:col-span-2" data-ulica-autocomplete>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ulica *
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={ulicaSearchTerm}
                      onChange={(e) => {
                        setUlicaSearchTerm(e.target.value)
                        setShowUlicaDropdown(true)
                      }}
                      onFocus={() => {
                        if (filteredUlice.length > 0 || ulicaSearchTerm.trim() !== '') {
                          setShowUlicaDropdown(true)
                        }
                      }}
                      placeholder="Kucajte naziv ulice za pretragu..."
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

              {/* Read-only polja - automatski popunjava se izborom ulice */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Država
                </label>
                <input
                  type="text"
                  value={drzave.find(d => d.id === parseInt(formData.iddrzava))?.opis || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grad
                </label>
                <input
                  type="text"
                  value={gradovi.find(g => g.id === parseInt(formData.idgrada))?.opis || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opština
                </label>
                <input
                  type="text"
                  value={opstine.find(o => o.id === parseInt(formData.idopstina))?.opis || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokacija
                </label>
                <input
                  type="text"
                  value={lokacije.find(l => l.id === parseInt(formData.idlokacija))?.opis || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Broj ulice - može se uneti nakon odabira ulice */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Broj ulice
                </label>
                <input
                  type="text"
                  value={formData.brojulice || ''}
                  onChange={(e) => handleFieldChange('brojulice', e.target.value)}
                  placeholder="npr. 15, 15A, 15-17..."
                  disabled={!formData.idulica}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {fieldsBySection.osnovne.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && '*'}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      required={field.required}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                      rows="3"
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
          </section>

          {/* Tehničke karakteristike */}
          {fieldsBySection.tehnicke.length > 0 && (
            <section className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                Tehničke karakteristike
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldsBySection.tehnicke.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                        rows="3"
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
                ))}
              </div>
            </section>
          )}

          {/* Opremljenost */}
          {fieldsBySection.opremljenost.length > 0 && (
            <section className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Opremljenost
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fieldsBySection.opremljenost.map(field => (
                  <div key={field.key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={field.key}
                      checked={formData[field.key] || false}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={field.key} className="ml-2 text-sm text-gray-700">
                      {field.label}
                    </label>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dodatna polja */}
          <section className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dodatne informacije</h3>
            
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Broj telefona
                </label>
                <input
                  type="text"
                  value={formData.brojtelefona || ''}
                  onChange={(e) => handleFieldChange('brojtelefona', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
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
                    <option key={investitor.id} value={investitor.id}>{investitor.opis}</option>
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
                  Latitude
                </label>
                <input
                  type="text"
                  value={formData.latitude || ''}
                  onChange={(e) => handleFieldChange('latitude', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  value={formData.longitude || ''}
                  onChange={(e) => handleFieldChange('longitude', e.target.value)}
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

          {/* Dodatna polja za brisanje (opciono) */}
          <section className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Dodatne opcije</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razlog brisanja
                </label>
                <input
                  type="text"
                  value={formData.stsrazlogbrisanja || ''}
                  onChange={(e) => handleFieldChange('stsrazlogbrisanja', e.target.value)}
                  placeholder="Razlog brisanja (ako je ponuda obrisana)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum brisanja
                </label>
                <input
                  type="datetime-local"
                  value={formData.datumbrisanja ? new Date(formData.datumbrisanja).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const value = e.target.value ? new Date(e.target.value).toISOString() : null
                    handleFieldChange('datumbrisanja', value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* JSONB Detalji - AI i ostalo */}
          <section className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">AI i dodatni detalji</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI opis (za pretragu)
                </label>
                <textarea
                  value={detalji.ai?.opis || ''}
                  onChange={(e) => handleDetaljiChange('ai', 'opis', e.target.value)}
                  placeholder="Dodatni opis za AI pretragu..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI ključne reči
                </label>
                <input
                  type="text"
                  value={detalji.ai?.kljucneReci || ''}
                  onChange={(e) => handleDetaljiChange('ai', 'kljucneReci', e.target.value)}
                  placeholder="Ključne reči odvojene zarezom..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
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

        {/* Fotografije - IZVUČENO VAN FORM ELEMENTA da spreči slučajni submit */}
        <div className="p-4 sm:p-6 border-t border-gray-200">
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Fotografije
            </h3>
            <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
          </section>
        </div>
      </div>
    </div>
  )
}
