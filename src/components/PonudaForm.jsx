import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { getCurrentUser } from '../utils/auth'
import PhotoUpload from './PhotoUpload'
import { Save, X, Upload, Building2, MapPin, DollarSign, Ruler, Info } from 'lucide-react'

// Definicija polja po vrstama objekata
const FIELD_DEFINITIONS = {
  // Polja koja se prikazuju za sve vrste objekata
  all: [
    { key: 'naslovaoglasa', label: 'Naslov oglasa', type: 'text', required: true, section: 'osnovne' },
    { key: 'cena', label: 'Cena (RSD)', type: 'number', required: true, section: 'osnovne' },
    { key: 'kvadratura', label: 'Kvadratura (m²)', type: 'number', section: 'osnovne' },
    { key: 'opis', label: 'Opis', type: 'textarea', section: 'osnovne' },
    { key: 'kontaktosoba', label: 'Kontakt osoba', type: 'text', section: 'osnovne' },
    { key: 'brojtelefona', label: 'Broj telefona', type: 'text', section: 'osnovne' },
  ],
  // Polja specifična za određene vrste objekata
  stan: [
    { key: 'struktura', label: 'Struktura', type: 'number', section: 'tehnicke' },
    { key: 'spratstana', label: 'Sprat stana', type: 'number', section: 'tehnicke' },
    { key: 'spratnostzgrade', label: 'Spratnost zgrade', type: 'number', section: 'tehnicke' },
    { key: 'sprat', label: 'Sprat', type: 'text', section: 'tehnicke' },
    { key: 'ststelefon', label: 'Telefon', type: 'checkbox', section: 'opremljenost' },
    { key: 'stslift', label: 'Lift', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsuknjizen', label: 'Uknižen', type: 'checkbox', section: 'opremljenost' },
    { key: 'stspodrum', label: 'Podrum', type: 'checkbox', section: 'opremljenost' },
    { key: 'ststoplavoda', label: 'Topla voda', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsinterfon', label: 'Interfon', type: 'checkbox', section: 'opremljenost' },
    { key: 'stszasebno', label: 'Zasebno', type: 'checkbox', section: 'opremljenost' },
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
    { key: 'stspodrum', label: 'Podrum', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsimagarazu', label: 'Ima garažu', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsimaparking', label: 'Ima parking', type: 'checkbox', section: 'opremljenost' },
    { key: 'stsdvamokracvora', label: 'Dva mokraćvora', type: 'checkbox', section: 'opremljenost' },
  ],
  poslovni: [
    { key: 'struktura', label: 'Struktura', type: 'number', section: 'tehnicke' },
    { key: 'sprat', label: 'Sprat', type: 'text', section: 'tehnicke' },
    { key: 'opissekretarice', label: 'Opis sekretarice', type: 'textarea', section: 'tehnicke' },
    { key: 'prostorije', label: 'Prostorije', type: 'text', section: 'tehnicke' },
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
  
  // Osnovne informacije
  const [formData, setFormData] = useState({
    idvrstaobjekta: '',
    iddrzava: '',
    idgrada: '',
    idopstina: '',
    idlokacija: '',
    idulica: '',
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
    // Dodatna polja
    ari: '',
    etaze: '',
    opissekretarice: '',
    prostorije: '',
    latitude: '',
    longitude: '',
    videolink: '',
    internenapomene: '',
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

  // Selektovana vrsta objekta
  const [selectedVrstaObjekta, setSelectedVrstaObjekta] = useState(null)

  useEffect(() => {
    loadLookupData()
  }, [])

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
        { data: investitoriData }
      ] = await Promise.all([
        supabase.from('vrstaobjekta').select('*').order('opis'),
        supabase.from('drzava').select('*').order('opis'),
        supabase.from('grejanje').select('*').order('opis'),
        supabase.from('investitor').select('*').order('opis')
      ])

      setVrsteObjekata(vrsteData || [])
      setDrzave(drzaveData || [])
      setGrejanja(grejanjaData || [])
      setInvestitori(investitoriData || [])
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
        // Dodatna polja
        ari: formData.ari ? parseFloat(formData.ari) : null,
        etaze: formData.etaze || null,
        opissekretarice: formData.opissekretarice || null,
        prostorije: formData.prostorije || null,
      }

      // Lokacija podaci
      if (formData.iddrzava) ponudaData.iddrzava = parseInt(formData.iddrzava)
      if (formData.idgrada) ponudaData.idgrada = parseInt(formData.idgrada)
      if (formData.idopstina) ponudaData.idopstina = parseInt(formData.idopstina)
      if (formData.idlokacija) ponudaData.idlokacija = parseInt(formData.idlokacija)
      if (formData.idulica) ponudaData.idulica = parseInt(formData.idulica)

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-auto max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Dodaj novu ponudu
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Država
                </label>
                <select
                  value={formData.iddrzava}
                  onChange={(e) => handleFieldChange('iddrzava', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Izaberite državu</option>
                  {drzave.map(drzava => (
                    <option key={drzava.id} value={drzava.id}>{drzava.opis}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grad
                </label>
                <select
                  value={formData.idgrada}
                  onChange={(e) => handleFieldChange('idgrada', e.target.value)}
                  disabled={!formData.iddrzava}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Izaberite grad</option>
                  {gradovi.map(grad => (
                    <option key={grad.id} value={grad.id}>{grad.opis}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opština
                </label>
                <select
                  value={formData.idopstina}
                  onChange={(e) => handleFieldChange('idopstina', e.target.value)}
                  disabled={!formData.idgrada}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Izaberite opštinu</option>
                  {opstine.map(opstina => (
                    <option key={opstina.id} value={opstina.id}>{opstina.opis}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokacija
                </label>
                <select
                  value={formData.idlokacija}
                  onChange={(e) => handleFieldChange('idlokacija', e.target.value)}
                  disabled={!formData.idopstina}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Izaberite lokaciju</option>
                  {lokacije.map(lokacija => (
                    <option key={lokacija.id} value={lokacija.id}>{lokacija.opis}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ulica
                </label>
                <select
                  value={formData.idulica}
                  onChange={(e) => handleFieldChange('idulica', e.target.value)}
                  disabled={!formData.idlokacija}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Izaberite ulicu</option>
                  {ulice.map(ulica => (
                    <option key={ulica.id} value={ulica.id}>{ulica.opis}</option>
                  ))}
                </select>
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

          {/* Fotografije */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Fotografije
            </h3>
            <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
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
    </div>
  )
}
