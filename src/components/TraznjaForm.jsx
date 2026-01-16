import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabase'
import { getCurrentUser } from '../utils/auth'
import { Save, X, Building2, MapPin, DollarSign, Ruler, Info, Search, ChevronDown, Users, FileText, Receipt, UserCheck, Brain, Plus, Trash2, Phone, Calendar, Home, Euro } from 'lucide-react'

export default function TraznjaForm({ traznja, onClose, onSuccess }) {
  const currentUser = getCurrentUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEditing = !!traznja

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
    idulica: ''
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

  // JSONB ai_karakteristike
  const [aiKarakteristike, setAiKarakteristike] = useState({
    tip_nekretnine: [],
    karakteristike: {
      lift: false, terasa: false, parking: false, garaza: false,
      novogradnja: false, namesten: false, klima: false
    },
    preferencije: {
      sprat_od: '', sprat_do: '', orijentacija: '', blizina_centra: false,
      mirna_lokacija: false, blizina_skole: false, blizina_prevoza: false
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
        idulica: traznjaData.idulica || ''
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

  // AI karakteristike handleri
  const handleAiKarakteristikeChange = (field, value) => {
    setAiKarakteristike(prev => ({ ...prev, karakteristike: { ...prev.karakteristike, [field]: value } }))
  }

  const handleAiPreferencijeChange = (field, value) => {
    setAiKarakteristike(prev => ({ ...prev, preferencije: { ...prev.preferencije, [field]: value } }))
  }

  const handleTipNekretnineToggle = (tip) => {
    setAiKarakteristike(prev => {
      const current = Array.isArray(prev.tip_nekretnine) ? prev.tip_nekretnine : []
      const newTipovi = current.includes(tip) ? current.filter(t => t !== tip) : [...current, tip]
      return { ...prev, tip_nekretnine: newTipovi }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!currentUser) throw new Error('Korisnik nije prijavljen')

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
        ai_karakteristike: aiKarakteristike
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
                {/* Kontakt */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center text-white text-xs">📞</span>
                    Kontakt informacije
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">👤 Kontakt osoba</label>
                      <input
                        type="text"
                        value={formData.kontaktosoba}
                        onChange={(e) => handleFieldChange('kontaktosoba', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Ime i prezime"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">📱 Telefon</label>
                      <input
                        type="text"
                        value={formData.kontakttelefon}
                        onChange={(e) => handleFieldChange('kontakttelefon', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="+381 XX XXX XXXX"
                      />
                    </div>
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
              <div className="mt-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                {/* Tip nekretnine */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
                  <h4 className="font-semibold text-slate-700 mb-3">🏠 Tip nekretnine</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Stan', 'Kuća', 'Poslovni prostor', 'Plac', 'Garaža', 'Vikendica'].map(tip => (
                      <button
                        key={tip}
                        type="button"
                        onClick={() => handleTipNekretnineToggle(tip)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          aiKarakteristike.tip_nekretnine?.includes(tip)
                            ? 'bg-amber-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {tip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Karakteristike */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
                  <h4 className="font-semibold text-slate-700 mb-3">✨ Željene karakteristike</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { key: 'lift', label: '🛗 Lift' },
                      { key: 'terasa', label: '🌅 Terasa' },
                      { key: 'parking', label: '🅿️ Parking' },
                      { key: 'garaza', label: '🚗 Garaža' },
                      { key: 'novogradnja', label: '🏗️ Novogradnja' },
                      { key: 'namesten', label: '🛋️ Namešten' },
                      { key: 'klima', label: '❄️ Klima' }
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 p-2 bg-white rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={aiKarakteristike.karakteristike[item.key] || false}
                          onChange={(e) => handleAiKarakteristikeChange(item.key, e.target.checked)}
                          className="rounded border-gray-300 text-amber-600"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preferencije */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3">🎯 Preferencije</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sprat od</label>
                      <input
                        type="number"
                        value={aiKarakteristike.preferencije.sprat_od || ''}
                        onChange={(e) => handleAiPreferencijeChange('sprat_od', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sprat do</label>
                      <input
                        type="number"
                        value={aiKarakteristike.preferencije.sprat_do || ''}
                        onChange={(e) => handleAiPreferencijeChange('sprat_do', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Orijentacija</label>
                      <select
                        value={aiKarakteristike.preferencije.orijentacija || ''}
                        onChange={(e) => handleAiPreferencijeChange('orijentacija', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="">Bilo koja</option>
                        <option value="sever">Sever</option>
                        <option value="jug">Jug</option>
                        <option value="istok">Istok</option>
                        <option value="zapad">Zapad</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { key: 'blizina_centra', label: '🏙️ Blizu centra' },
                      { key: 'mirna_lokacija', label: '🤫 Mirna lokacija' },
                      { key: 'blizina_skole', label: '🏫 Blizu škole' },
                      { key: 'blizina_prevoza', label: '🚌 Blizu prevoza' }
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 p-2 bg-white rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={aiKarakteristike.preferencije[item.key] || false}
                          onChange={(e) => handleAiPreferencijeChange(item.key, e.target.checked)}
                          className="rounded border-gray-300 text-amber-600"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
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
