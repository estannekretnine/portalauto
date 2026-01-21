import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { List, Plus, Pencil, Trash2, Search, Play, Power, PowerOff, ExternalLink, X, Save, Loader2, PlayCircle, CheckCircle, XCircle, AlertTriangle, RefreshCw, Clock, Users } from 'lucide-react'

export default function ScrapingConfigModule() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const [saving, setSaving] = useState(false)
  const [runningId, setRunningId] = useState(null)
  
  // Batch scraping state
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentLink: '', status: '' })
  const [batchResults, setBatchResults] = useState(null)
  
  // Pojedinačni scraping state
  const [singleResult, setSingleResult] = useState(null)
  const [singleRunningConfig, setSingleRunningConfig] = useState(null)
  
  // Filteri
  const [filterPortal, setFilterPortal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Statistika
  const [stats, setStats] = useState({
    ukupno: 0,
    aktivnih: 0,
    neaktivnih: 0
  })

  // Globalna statistika scrapinga
  const [globalStats, setGlobalStats] = useState({
    ukupnoVlasnika: 0,
    danasnjiOglasi: 0,
    poslednjiScraping: null
  })

  // Forma - pojednostavljena (bez kategorija, tip, grad)
  const [formData, setFormData] = useState({
    portal: '',
    url: '',
    opis: '',
    samo_vlasnici: true,
    limit_oglasa: 20,
    prioritet: 5,
    aktivan: true
  })

  useEffect(() => {
    loadConfigs()
    loadGlobalStats()
  }, [])

  const loadGlobalStats = async () => {
    try {
      // Ukupan broj vlasnika
      const { count: ukupnoVlasnika } = await supabase
        .from('vlasnici')
        .select('*', { count: 'exact', head: true })

      // Današnji oglasi
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: danasnjiOglasi } = await supabase
        .from('vlasnici')
        .select('*', { count: 'exact', head: true })
        .gte('datumkreiranja', today.toISOString())

      // Poslednji scraping
      const { data: poslednjiScraping } = await supabase
        .from('vremetrajanja')
        .select('*')
        .order('datumpocetak', { ascending: false })
        .limit(1)
        .single()

      setGlobalStats({
        ukupnoVlasnika: ukupnoVlasnika || 0,
        danasnjiOglasi: danasnjiOglasi || 0,
        poslednjiScraping
      })
    } catch (error) {
      console.error('Greška pri učitavanju globalne statistike:', error)
    }
  }

  const loadConfigs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('scraping_config')
        .select('*')
        .order('prioritet', { ascending: false })

      if (error) throw error

      setConfigs(data || [])
      
      // Statistika
      const ukupno = data?.length || 0
      const aktivnih = data?.filter(c => c.aktivan).length || 0
      setStats({
        ukupno,
        aktivnih,
        neaktivnih: ukupno - aktivnih
      })

    } catch (error) {
      console.error('Greška pri učitavanju konfiguracija:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingConfig) {
        // Update
        const { error } = await supabase
          .from('scraping_config')
          .update({
            ...formData,
            datumpromene: new Date().toISOString()
          })
          .eq('id', editingConfig.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('scraping_config')
          .insert([formData])

        if (error) throw error
      }

      setShowForm(false)
      setEditingConfig(null)
      resetForm()
      loadConfigs()
    } catch (error) {
      console.error('Greška pri čuvanju:', error)
      alert('Greška: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (config) => {
    setEditingConfig(config)
    setFormData({
      portal: config.portal || '',
      url: config.url || '',
      opis: config.opis || '',
      samo_vlasnici: config.samo_vlasnici ?? true,
      limit_oglasa: config.limit_oglasa || 20,
      prioritet: config.prioritet || 5,
      aktivan: config.aktivan ?? true
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu konfiguraciju?')) return

    try {
      const { error } = await supabase
        .from('scraping_config')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadConfigs()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška: ' + error.message)
    }
  }

  const handleToggleActive = async (config) => {
    try {
      const { error } = await supabase
        .from('scraping_config')
        .update({ 
          aktivan: !config.aktivan,
          datumpromene: new Date().toISOString()
        })
        .eq('id', config.id)

      if (error) throw error
      loadConfigs()
    } catch (error) {
      console.error('Greška pri promeni statusa:', error)
    }
  }

  // Odredi koju Edge Function da pozove na osnovu URL-a
  const getEdgeFunctionName = (url) => {
    if (url.includes('4zida.rs')) return 'scrape-4zida'
    if (url.includes('halooglasi.com')) return 'scrape-halooglasi'
    // Fallback na halooglasi za nepoznate portale
    return 'scrape-halooglasi'
  }

  const handleRunScraping = async (config) => {
    setRunningId(config.id)
    setSingleRunningConfig(config)
    setSingleResult(null)
    const functionName = getEdgeFunctionName(config.url)
    console.log(`Pokrećem ${functionName} za ${config.url}`)
    const startTime = new Date()
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { url: config.url, limit: config.limit_oglasa }
      })

      if (error) throw error

      const endTime = new Date()
      const trajanjeSekunde = Math.round((endTime - startTime) / 1000)
      const trajanjeFormatted = `${Math.floor(trajanjeSekunde / 60)}m ${trajanjeSekunde % 60}s`

      // Ažuriraj poslednji scraping
      await supabase
        .from('scraping_config')
        .update({
          poslednji_scraping: new Date().toISOString(),
          poslednji_status: data.success ? 'uspeh' : 'greska',
          ukupno_pronadjeno: (config.ukupno_pronadjeno || 0) + (data.ukupno || 0),
          ukupno_novih: (config.ukupno_novih || 0) + (data.novi || 0)
        })
        .eq('id', config.id)

      // Postavi rezultate u state umesto alert()
      setSingleResult({
        success: true,
        config: config,
        ukupno: data.ukupno || 0,
        novi: data.novi || 0,
        preskoceni: data.preskoceni || 0,
        agencije: data.agencije || 0,
        trajanje: trajanjeFormatted,
        detalji: data.detalji || []
      })
      
      loadConfigs()
      loadGlobalStats()
    } catch (error) {
      console.error('Greška pri scrapingu:', error)
      setSingleResult({
        success: false,
        config: config,
        error: error.message
      })
    } finally {
      setRunningId(null)
      setSingleRunningConfig(null)
    }
  }

  const resetSingleResult = () => {
    setSingleResult(null)
  }

  // Pokreni scraping za selektovani portal (ili sve ako nije selektovan)
  const handleRunAllScraping = async () => {
    const aktivniConfigs = configs.filter(c => {
      if (!c.aktivan) return false
      if (filterPortal && c.portal !== filterPortal) return false
      return true
    })
    
    if (aktivniConfigs.length === 0) {
      alert(filterPortal 
        ? `Nema aktivnih linkova za portal "${filterPortal}".`
        : 'Nema aktivnih linkova za scraping.'
      )
      return
    }

    setBatchRunning(true)
    setBatchResults(null)
    
    const results = []
    let ukupnoNovih = 0
    let ukupnoPronadjeno = 0
    let uspesnih = 0
    let neuspesnih = 0
    const startTime = new Date()

    for (let i = 0; i < aktivniConfigs.length; i++) {
      const config = aktivniConfigs[i]
      const functionName = getEdgeFunctionName(config.url)
      
      setBatchProgress({
        current: i + 1,
        total: aktivniConfigs.length,
        currentLink: config.opis || config.url,
        status: `Obrađujem ${i + 1}/${aktivniConfigs.length} (${functionName})...`
      })

      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { url: config.url, limit: config.limit_oglasa }
        })

        if (error) throw error

        // Ažuriraj poslednji scraping u bazi
        await supabase
          .from('scraping_config')
          .update({
            poslednji_scraping: new Date().toISOString(),
            poslednji_status: data.success ? 'uspeh' : 'greska',
            ukupno_pronadjeno: (config.ukupno_pronadjeno || 0) + (data.ukupno || 0),
            ukupno_novih: (config.ukupno_novih || 0) + (data.novi || 0)
          })
          .eq('id', config.id)

        results.push({
          config,
          success: true,
          ukupno: data.ukupno || 0,
          novi: data.novi || 0,
          preskoceni: data.preskoceni || 0
        })

        ukupnoPronadjeno += data.ukupno || 0
        ukupnoNovih += data.novi || 0
        uspesnih++

      } catch (error) {
        console.error(`Greška za ${config.opis}:`, error)
        
        results.push({
          config,
          success: false,
          error: error.message
        })
        
        neuspesnih++

        // Ažuriraj status greške
        await supabase
          .from('scraping_config')
          .update({
            poslednji_scraping: new Date().toISOString(),
            poslednji_status: 'greska'
          })
          .eq('id', config.id)
      }

      // Pauza između linkova (2 sekunde)
      if (i < aktivniConfigs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    const endTime = new Date()
    const trajanje = Math.round((endTime - startTime) / 1000)

    setBatchProgress({
      current: aktivniConfigs.length,
      total: aktivniConfigs.length,
      currentLink: '',
      status: 'Završeno!'
    })

    setBatchResults({
      results,
      ukupnoPronadjeno,
      ukupnoNovih,
      uspesnih,
      neuspesnih,
      trajanje: `${Math.floor(trajanje / 60)}m ${trajanje % 60}s`
    })

    setBatchRunning(false)
    loadConfigs()
    loadGlobalStats()
  }

  const resetBatchResults = () => {
    setBatchResults(null)
    setBatchProgress({ current: 0, total: 0, currentLink: '', status: '' })
  }

  const resetForm = () => {
    setFormData({
      portal: '',
      url: '',
      opis: '',
      samo_vlasnici: true,
      limit_oglasa: 20,
      prioritet: 5,
      aktivan: true
    })
  }

  const handleAddNew = () => {
    setEditingConfig(null)
    resetForm()
    setShowForm(true)
  }

  // Filtriranje - pojednostavljeno
  const filteredConfigs = configs.filter(config => {
    if (filterPortal && config.portal !== filterPortal) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      if (!config.url?.toLowerCase().includes(search) && 
          !config.opis?.toLowerCase().includes(search)) {
        return false
      }
    }
    return true
  })

  // Unique values za filtere
  const uniquePortali = [...new Set(configs.map(c => c.portal).filter(Boolean))]

  // Dinamički broj linkova za scraping na osnovu selekcije portala
  const filteredActiveCount = configs.filter(c => {
    if (!c.aktivan) return false
    if (filterPortal && c.portal !== filterPortal) return false
    return true
  }).length

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Start scraping</h2>
          <p className="text-gray-500 text-sm mt-1">Pokretanje scrapinga po portalima</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Statistika kao badge-evi */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Ukupno: {stats.ukupno}
            </span>
            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Aktivnih: {stats.aktivnih}
            </span>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 font-medium"
          >
            <Plus className="w-5 h-5" />
            Dodaj
          </button>
        </div>
      </div>

      {/* Globalna statistika */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Ukupno vlasnika</div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.ukupnoVlasnika.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-200 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-green-600">Danas dodato</div>
              <div className="text-2xl font-bold text-green-700">{globalStats.danasnjiOglasi}</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-lg p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-amber-600">Poslednji scraping</div>
              <div className="text-lg font-bold text-amber-700">
                {globalStats.poslednjiScraping ? formatDate(globalStats.poslednjiScraping.datumpocetak) : '-'}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-4 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-200 rounded-xl flex items-center justify-center">
              <List className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-purple-600">Aktivnih linkova</div>
              <div className="text-2xl font-bold text-purple-700">{stats.aktivnih}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Poslednja sesija info */}
      {globalStats.poslednjiScraping && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Poslednja sesija
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Početak:</span>
              <p className="font-medium text-blue-900">{formatDate(globalStats.poslednjiScraping.datumpocetak)}</p>
            </div>
            <div>
              <span className="text-blue-600">Trajanje:</span>
              <p className="font-medium text-blue-900">{globalStats.poslednjiScraping.vremetrajanja || '-'}</p>
            </div>
            <div>
              <span className="text-blue-600">Novih oglasa:</span>
              <p className="font-medium text-green-700">{globalStats.poslednjiScraping.brojnovihoglasa || 0}</p>
            </div>
            <div>
              <span className="text-blue-600">Preskočeno:</span>
              <p className="font-medium text-gray-700">{globalStats.poslednjiScraping.brojarhiviranih || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dugme za pokretanje svih + Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <button
            onClick={handleRunAllScraping}
            disabled={batchRunning || filteredActiveCount === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25"
          >
            {batchRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scraping u toku...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                Pokreni scraping ({filteredActiveCount})
              </>
            )}
          </button>

          {batchResults && (
            <button
              onClick={resetBatchResults}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Resetuj
            </button>
          )}
        </div>

        {/* Progress bar */}
        {batchRunning && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{batchProgress.status}</span>
              <span>{batchProgress.current}/{batchProgress.total}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                style={{ width: batchProgress.total > 0 ? `${(batchProgress.current / batchProgress.total) * 100}%` : '0%' }}
              />
            </div>
            {batchProgress.currentLink && (
              <p className="text-sm text-gray-500 truncate">
                Trenutno: {batchProgress.currentLink}
              </p>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Molimo sačekajte</p>
                  <p>Scraping se izvršava sa pauzama između linkova. Ne zatvarajte stranicu.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rezultati batch scrapinga */}
        {batchResults && (
          <div className="space-y-4 mt-4">
            {/* Sumarni rezultati */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="text-xs text-blue-600 mb-1">Pronađeno</div>
                <div className="text-2xl font-bold text-blue-700">{batchResults.ukupnoPronadjeno}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <div className="text-xs text-green-600 mb-1">Novih</div>
                <div className="text-2xl font-bold text-green-700">{batchResults.ukupnoNovih}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="text-xs text-emerald-600 mb-1">Uspešnih</div>
                <div className="text-2xl font-bold text-emerald-700">{batchResults.uspesnih}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <div className="text-xs text-red-600 mb-1">Neuspešnih</div>
                <div className="text-2xl font-bold text-red-700">{batchResults.neuspesnih}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-xs text-gray-600 mb-1">Trajanje</div>
                <div className="text-2xl font-bold text-gray-700">{batchResults.trajanje}</div>
              </div>
            </div>

            {/* Detalji po linku */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">Detalji po linku</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {batchResults.results.map((result, index) => (
                  <div key={index} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {result.config.opis || result.config.portal || 'Link'}
                        </p>
                        {result.success ? (
                          <p className="text-xs text-gray-500">
                            Pronađeno: {result.ukupno} | Novih: {result.novi} | Preskočeno: {result.preskoceni}
                          </p>
                        ) : (
                          <p className="text-xs text-red-500">{result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filteri - pojednostavljeni */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži po URL-u ili opisu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filterPortal}
            onChange={(e) => setFilterPortal(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Svi portali</option>
            {uniquePortali.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela - pojednostavljena */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Učitavam konfiguracije...</p>
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="p-12 text-center">
            <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nema konfiguracija</p>
            <button
              onClick={handleAddNew}
              className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600"
            >
              Dodaj prvu konfiguraciju
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Portal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Opis / Link</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Prioritet</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Limit</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Poslednji scraping</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredConfigs.map((config) => (
                  <tr key={config.id} className={`hover:bg-gray-50 transition-colors ${!config.aktivan ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                        {config.portal || '-'}
                      </span>
                      {config.samo_vlasnici && (
                        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          vlasnici
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[300px]">
                        <p className="text-sm font-medium text-gray-800 truncate" title={config.opis}>
                          {config.opis || 'Bez opisa'}
                        </p>
                        <a 
                          href={config.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1 truncate"
                          title={config.url}
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{config.url}</span>
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        config.prioritet >= 8 ? 'bg-red-100 text-red-700' :
                        config.prioritet >= 5 ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {config.prioritet}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-600">{config.limit_oglasa}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(config)}
                        className={`p-2 rounded-lg transition-colors ${
                          config.aktivan 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={config.aktivan ? 'Deaktiviraj' : 'Aktiviraj'}
                      >
                        {config.aktivan ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="text-gray-700">{formatDate(config.poslednji_scraping)}</p>
                        {config.poslednji_status && (
                          <span className={`text-xs ${
                            config.poslednji_status === 'uspeh' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {config.poslednji_status}
                            {config.ukupno_novih > 0 && ` (${config.ukupno_novih} novih)`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleRunScraping(config)}
                          disabled={runningId === config.id || !config.aktivan || batchRunning}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Pokreni scraping"
                        >
                          {runningId === config.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Izmeni"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Obriši"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Progress pojedinačnog scrapinga */}
      {singleRunningConfig && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            Scraping u toku...
          </h3>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Play className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-amber-900">
                  {singleRunningConfig.opis || singleRunningConfig.portal || 'Scraping'}
                </p>
                <p className="text-sm text-amber-700 truncate mt-1">
                  {singleRunningConfig.url}
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Limit: {singleRunningConfig.limit_oglasa} oglasa
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Molimo sačekajte</p>
                <p>Scraping se izvršava. Ne zatvarajte stranicu.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rezultati pojedinačnog scrapinga */}
      {singleResult && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              {singleResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Rezultat scrapinga
            </h3>
            <button
              onClick={resetSingleResult}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Zatvori"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info o portalu */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <p className="font-medium text-gray-800">
              {singleResult.config.opis || singleResult.config.portal || 'Link'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {singleResult.config.url}
            </p>
          </div>

          {singleResult.success ? (
            <>
              {/* Statistika kartice */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <div className="text-xs text-blue-600 mb-1">Pronađeno</div>
                  <div className="text-2xl font-bold text-blue-700">{singleResult.ukupno}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <div className="text-xs text-green-600 mb-1">Novih</div>
                  <div className="text-2xl font-bold text-green-700">{singleResult.novi}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Preskočeno</div>
                  <div className="text-2xl font-bold text-gray-700">{singleResult.preskoceni}</div>
                </div>
                {singleResult.agencije > 0 && (
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                    <div className="text-xs text-orange-600 mb-1">Agencije</div>
                    <div className="text-2xl font-bold text-orange-700">{singleResult.agencije}</div>
                  </div>
                )}
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                  <div className="text-xs text-purple-600 mb-1">Trajanje</div>
                  <div className="text-2xl font-bold text-purple-700">{singleResult.trajanje}</div>
                </div>
              </div>

              {/* Lista detalja ako postoji */}
              {singleResult.detalji && singleResult.detalji.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-700">Detalji ({singleResult.detalji.length})</span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {singleResult.detalji.map((item, index) => (
                      <div key={index} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {item.status === 'dodat' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Dodat
                              </span>
                            )}
                            {item.status === 'preskocen' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                Preskočen
                              </span>
                            )}
                            {item.status === 'greska' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                <XCircle className="w-3 h-3" />
                                Greška
                              </span>
                            )}
                            <span className="font-medium text-gray-900 text-sm">{item.imevlasnika || 'Nepoznat'}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date().toLocaleString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.opstina && <span>{item.opstina}</span>}
                          {item.lokacija && <span> • {item.lokacija}</span>}
                          {item.cena && <span> • {item.cena.toLocaleString()}€</span>}
                          {item.kvadratura && <span> • {item.kvadratura}m²</span>}
                        </div>
                        {item.telefon1 && (
                          <div className="text-xs text-blue-600 mt-1">
                            Tel: {item.telefon1}{item.telefon2 && `, ${item.telefon2}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">Scraping nije uspeo</p>
                  <p className="text-sm text-red-700 mt-1">{singleResult.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal forma - pojednostavljena */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingConfig ? 'Izmeni konfiguraciju' : 'Nova konfiguracija'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Portal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portal</label>
                <input
                  type="text"
                  value={formData.portal}
                  onChange={(e) => setFormData({ ...formData, portal: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="npr. halooglasi, nekretnine.rs..."
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="https://www.halooglasi.com/nekretnine/..."
                  required
                />
              </div>

              {/* Opis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                <input
                  type="text"
                  value={formData.opis}
                  onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="npr. Stanovi prodaja Beograd - Vlasnici"
                />
              </div>

              {/* Limit i Prioritet */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limit oglasa</label>
                  <input
                    type="number"
                    value={formData.limit_oglasa}
                    onChange={(e) => setFormData({ ...formData, limit_oglasa: parseInt(e.target.value) || 20 })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max oglasa po pokretanju</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioritet (1-10)</label>
                  <input
                    type="number"
                    value={formData.prioritet}
                    onChange={(e) => setFormData({ ...formData, prioritet: parseInt(e.target.value) || 5 })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Viši = prvi u listi</p>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.samo_vlasnici}
                    onChange={(e) => setFormData({ ...formData, samo_vlasnici: e.target.checked })}
                    className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Samo vlasnici</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.aktivan}
                    onChange={(e) => setFormData({ ...formData, aktivan: e.target.checked })}
                    className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">Aktivan</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {editingConfig ? 'Sačuvaj' : 'Dodaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
