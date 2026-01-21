import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { List, Plus, Pencil, Trash2, Search, Play, Power, PowerOff, ExternalLink, X, Save, Loader2 } from 'lucide-react'

export default function ScrapingConfigModule() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const [saving, setSaving] = useState(false)
  const [runningId, setRunningId] = useState(null)
  
  // Filteri
  const [filterPortal, setFilterPortal] = useState('')
  const [filterKategorija, setFilterKategorija] = useState('')
  const [filterTip, setFilterTip] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Statistika
  const [stats, setStats] = useState({
    ukupno: 0,
    aktivnih: 0,
    neaktivnih: 0
  })

  // Forma
  const [formData, setFormData] = useState({
    portal: 'halooglasi',
    kategorija: 'stan',
    tip: 'prodaja',
    grad: 'beograd',
    url: '',
    opis: '',
    samo_vlasnici: true,
    limit_oglasa: 20,
    prioritet: 5,
    aktivan: true
  })

  const portali = ['halooglasi', 'nekretnine.rs', '4zida', 'cityexpert', 'sasomange', 'oglasi.rs']
  const kategorije = ['stan', 'kuca', 'lokal', 'zemljiste', 'garaza', 'poslovni_prostor']
  const tipovi = ['prodaja', 'izdavanje']

  useEffect(() => {
    loadConfigs()
  }, [])

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
      portal: config.portal || 'halooglasi',
      kategorija: config.kategorija || 'stan',
      tip: config.tip || 'prodaja',
      grad: config.grad || 'beograd',
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

  const handleRunScraping = async (config) => {
    setRunningId(config.id)
    try {
      const { data, error } = await supabase.functions.invoke('scrape-halooglasi', {
        body: { url: config.url, limit: config.limit_oglasa }
      })

      if (error) throw error

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

      alert(`Scraping završen!\nUkupno: ${data.ukupno}\nNovih: ${data.novi}`)
      loadConfigs()
    } catch (error) {
      console.error('Greška pri scrapingu:', error)
      alert('Greška: ' + error.message)
    } finally {
      setRunningId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      portal: 'halooglasi',
      kategorija: 'stan',
      tip: 'prodaja',
      grad: 'beograd',
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

  // Filtriranje
  const filteredConfigs = configs.filter(config => {
    if (filterPortal && config.portal !== filterPortal) return false
    if (filterKategorija && config.kategorija !== filterKategorija) return false
    if (filterTip && config.tip !== filterTip) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      if (!config.url?.toLowerCase().includes(search) && 
          !config.opis?.toLowerCase().includes(search) &&
          !config.grad?.toLowerCase().includes(search)) {
        return false
      }
    }
    return true
  })

  // Unique values za filtere
  const uniquePortali = [...new Set(configs.map(c => c.portal).filter(Boolean))]
  const uniqueKategorije = [...new Set(configs.map(c => c.kategorija).filter(Boolean))]

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
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Lista portala i linkova</h2>
          <p className="text-gray-500 text-sm mt-1">Konfiguracija URL-ova za scraping nekretnina</p>
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
            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              Neaktivnih: {stats.neaktivnih}
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

      {/* Filteri */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži po URL-u, opisu, gradu..."
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

          <select
            value={filterKategorija}
            onChange={(e) => setFilterKategorija(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Sve kategorije</option>
            {uniqueKategorije.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          <select
            value={filterTip}
            onChange={(e) => setFilterTip(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Svi tipovi</option>
            <option value="prodaja">Prodaja</option>
            <option value="izdavanje">Izdavanje</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
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
                  <th className="px-4 py-3 text-left text-sm font-semibold">Kategorija</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tip</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Grad</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Opis</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Prioritet</th>
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
                        {config.portal}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">{config.kategorija}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        config.tip === 'prodaja' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {config.tip}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">{config.grad}</td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px]">
                        <p className="text-sm text-gray-700 truncate" title={config.opis}>
                          {config.opis || '-'}
                        </p>
                        <a 
                          href={config.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Link
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
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleRunScraping(config)}
                          disabled={runningId === config.id || !config.aktivan}
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

      {/* Modal forma */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Portal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portal</label>
                  <select
                    value={formData.portal}
                    onChange={(e) => setFormData({ ...formData, portal: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {portali.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Kategorija */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategorija</label>
                  <select
                    value={formData.kategorija}
                    onChange={(e) => setFormData({ ...formData, kategorija: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {kategorije.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                {/* Tip */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                  <select
                    value={formData.tip}
                    onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {tipovi.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Grad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grad</label>
                  <input
                    type="text"
                    value={formData.grad}
                    onChange={(e) => setFormData({ ...formData, grad: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="beograd"
                  />
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
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
                  placeholder="npr. HaloOglasi - Stanovi prodaja - Beograd - Vlasnici"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Limit oglasa */}
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
                </div>

                {/* Prioritet */}
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
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-6">
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
                  {editingConfig ? 'Sačuvaj izmene' : 'Dodaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
