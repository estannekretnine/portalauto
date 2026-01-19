import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Map, Plus, Search, Edit2, Trash2, X, Save, Loader2, Calendar, User, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

export default function TereniModule() {
  const [tereni, setTereni] = useState([])
  const [ponude, setPonude] = useState([])
  const [traznje, setTraznje] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTeren, setEditingTeren] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)

  // Forma state
  const [formData, setFormData] = useState({
    idponude: '',
    idtraznja: '',
    komentar: '',
    utisakkupca: 5,
    glavnezamerke: '',
    glavnepohvale: '',
    spremnostnacenu: false,
    spremnostnacenuopis: '',
    nacinplacanja: '',
    arhiviran: false,
    detaljitraznje: {
      neverbalna_komunikacija: '',
      deal_breaker_faktori: '',
      poredjenje_sa_prethodnim: '',
      hitnost_useljenja: '',
      emocionalna_reakcija: '',
      dodatne_napomene: ''
    }
  })

  // Učitaj podatke
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Učitaj terene sa povezanim podacima
      const { data: tereniData, error: tereniError } = await supabase
        .from('tereni')
        .select(`
          *,
          ponuda:idponude(id, cena, kvadratura, stsrentaprodaja, metapodaci, vrstaobjekta:idvrstaobjekta(opis), opstina:idopstina(opis)),
          traznja:idtraznja(id, kontaktosoba, stskupaczakupac, metapodaci),
          korisnik:iduser(ime, prezime)
        `)
        .order('datumkreiranja', { ascending: false })

      if (tereniError) throw tereniError
      setTereni(tereniData || [])

      // Učitaj ponude za dropdown
      const { data: ponudeData } = await supabase
        .from('ponuda')
        .select('id, cena, kvadratura, stsrentaprodaja, metapodaci, vrstaobjekta:idvrstaobjekta(opis), opstina:idopstina(opis)')
        .eq('stsaktivan', true)
        .order('id', { ascending: false })
      setPonude(ponudeData || [])

      // Učitaj tražnje za dropdown
      const { data: traznjeData } = await supabase
        .from('traznja')
        .select('id, kontaktosoba, stskupaczakupac, metapodaci')
        .eq('stsaktivan', true)
        .order('id', { ascending: false })
      setTraznje(traznjeData || [])

    } catch (error) {
      console.error('Greška pri učitavanju:', error)
      alert('Greška pri učitavanju podataka')
    } finally {
      setLoading(false)
    }
  }

  // Dobij ime prodavca iz ponude
  const getProdavacIme = (ponuda) => {
    if (!ponuda) return '-'
    const vlasnici = ponuda.metapodaci?.vlasnici || []
    if (vlasnici.length > 0 && (vlasnici[0].ime || vlasnici[0].prezime)) {
      return `${vlasnici[0].ime || ''} ${vlasnici[0].prezime || ''}`.trim()
    }
    return `Ponuda #${ponuda.id}`
  }

  // Dobij ime kupca iz tražnje
  const getKupacIme = (traznja) => {
    if (!traznja) return '-'
    if (traznja.kontaktosoba) return traznja.kontaktosoba
    const nalogodavci = traznja.metapodaci?.nalogodavci || []
    if (nalogodavci.length > 0 && (nalogodavci[0].ime || nalogodavci[0].prezime)) {
      return `${nalogodavci[0].ime || ''} ${nalogodavci[0].prezime || ''}`.trim()
    }
    return `Tražnja #${traznja.id}`
  }

  // Format datuma
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Otvori formu za novi teren
  const handleAdd = () => {
    setEditingTeren(null)
    setFormData({
      idponude: '',
      idtraznja: '',
      komentar: '',
      utisakkupca: 5,
      glavnezamerke: '',
      glavnepohvale: '',
      spremnostnacenu: false,
      spremnostnacenuopis: '',
      nacinplacanja: '',
      arhiviran: false,
      detaljitraznje: {
        neverbalna_komunikacija: '',
        deal_breaker_faktori: '',
        poredjenje_sa_prethodnim: '',
        hitnost_useljenja: '',
        emocionalna_reakcija: '',
        dodatne_napomene: ''
      }
    })
    setShowForm(true)
  }

  // Otvori formu za izmenu
  const handleEdit = (teren) => {
    setEditingTeren(teren)
    setFormData({
      idponude: teren.idponude || '',
      idtraznja: teren.idtraznja || '',
      komentar: teren.komentar || '',
      utisakkupca: teren.utisakkupca || 5,
      glavnezamerke: teren.glavnezamerke || '',
      glavnepohvale: teren.glavnepohvale || '',
      spremnostnacenu: teren.spremnostnacenu || false,
      spremnostnacenuopis: teren.spremnostnacenuopis || '',
      nacinplacanja: teren.nacinplacanja || '',
      arhiviran: teren.arhiviran || false,
      detaljitraznje: teren.detaljitraznje || {
        neverbalna_komunikacija: '',
        deal_breaker_faktori: '',
        poredjenje_sa_prethodnim: '',
        hitnost_useljenja: '',
        emocionalna_reakcija: '',
        dodatne_napomene: ''
      }
    })
    setShowForm(true)
  }

  // Sačuvaj teren
  const handleSave = async () => {
    if (!formData.idponude && !formData.idtraznja) {
      alert('Morate izabrati ponudu ili tražnju')
      return
    }

    setSaving(true)
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      
      const dataToSave = {
        idponude: formData.idponude || null,
        idtraznja: formData.idtraznja || null,
        komentar: formData.komentar,
        utisakkupca: formData.utisakkupca,
        glavnezamerke: formData.glavnezamerke,
        glavnepohvale: formData.glavnepohvale,
        spremnostnacenu: formData.spremnostnacenu,
        spremnostnacenuopis: formData.spremnostnacenuopis,
        nacinplacanja: formData.nacinplacanja,
        arhiviran: formData.arhiviran,
        detaljitraznje: formData.detaljitraznje,
        iduser: currentUser?.id || null
      }

      if (editingTeren) {
        // Update
        const { error } = await supabase
          .from('tereni')
          .update({
            ...dataToSave,
            datumpromene: new Date().toISOString()
          })
          .eq('id', editingTeren.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('tereni')
          .insert({
            ...dataToSave,
            datumkreiranja: new Date().toISOString()
          })

        if (error) throw error
      }

      setShowForm(false)
      fetchData()
    } catch (error) {
      console.error('Greška pri čuvanju:', error)
      alert('Greška pri čuvanju: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  // Obriši teren
  const handleDelete = async (id) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj teren?')) return

    try {
      const { error } = await supabase
        .from('tereni')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju: ' + error.message)
    }
  }

  // Handler za promenu detalja tražnje
  const handleDetaljiChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      detaljitraznje: {
        ...prev.detaljitraznje,
        [field]: value
      }
    }))
  }

  // Filtriraj terene
  const filteredTereni = tereni.filter(t => {
    const searchLower = searchTerm.toLowerCase()
    const kupac = getKupacIme(t.traznja).toLowerCase()
    const prodavac = getProdavacIme(t.ponuda).toLowerCase()
    const komentar = (t.komentar || '').toLowerCase()
    
    return kupac.includes(searchLower) || 
           prodavac.includes(searchLower) || 
           komentar.includes(searchLower)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Map className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tereni</h2>
              <p className="text-gray-500">Evidencija obilazaka nekretnina</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Pretraga */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full sm:w-64"
              />
            </div>

            {/* Dugme za dodavanje */}
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25"
            >
              <Plus className="w-5 h-5" />
              Novi teren
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Datum</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kupac</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Prodavac</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Komentar</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Utisak</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTereni.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'Nema rezultata pretrage' : 'Nema evidentiranih terena'}
                  </td>
                </tr>
              ) : (
                filteredTereni.map((teren) => (
                  <>
                    <tr key={teren.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{formatDate(teren.datumkreiranja)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900">{getKupacIme(teren.traznja)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-medium text-gray-900">{getProdavacIme(teren.ponuda)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 max-w-xs truncate">{teren.komentar || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${star <= (teren.utisakkupca || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setExpandedRow(expandedRow === teren.id ? null : teren.id)}
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Detalji"
                          >
                            {expandedRow === teren.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(teren)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Izmeni"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(teren.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Obriši"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row - detalji */}
                    {expandedRow === teren.id && (
                      <tr className="bg-emerald-50/50">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Glavne pohvale</p>
                              <p className="text-sm text-gray-900">{teren.glavnepohvale || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Glavne zamerke</p>
                              <p className="text-sm text-gray-900">{teren.glavnezamerke || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Spremnost na cenu</p>
                              <p className="text-sm text-gray-900">
                                {teren.spremnostnacenu ? '✅ Da' : '❌ Ne'}
                                {teren.spremnostnacenuopis && ` - ${teren.spremnostnacenuopis}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Način plaćanja</p>
                              <p className="text-sm text-gray-900">{teren.nacinplacanja || '-'}</p>
                            </div>
                            {teren.detaljitraznje && (
                              <>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Neverbalna komunikacija</p>
                                  <p className="text-sm text-gray-900">{teren.detaljitraznje.neverbalna_komunikacija || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Deal-breaker faktori</p>
                                  <p className="text-sm text-gray-900">{teren.detaljitraznje.deal_breaker_faktori || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Poređenje sa prethodnim</p>
                                  <p className="text-sm text-gray-900">{teren.detaljitraznje.poredjenje_sa_prethodnim || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Hitnost useljenja</p>
                                  <p className="text-sm text-gray-900">{teren.detaljitraznje.hitnost_useljenja || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Emocionalna reakcija</p>
                                  <p className="text-sm text-gray-900">{teren.detaljitraznje.emocionalna_reakcija || '-'}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal forma */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingTeren ? 'Izmena terena' : 'Novi teren'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Forma */}
            <div className="p-6 space-y-6">
              {/* Ponuda i Tražnja */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ponuda (Prodavac)</label>
                  <select
                    value={formData.idponude}
                    onChange={(e) => setFormData({ ...formData, idponude: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">-- Izaberi ponudu --</option>
                    {ponude.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} - {getProdavacIme(p)} - {p.vrstaobjekta?.opis || ''} {p.kvadratura}m² - {p.cena}€
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tražnja (Kupac)</label>
                  <select
                    value={formData.idtraznja}
                    onChange={(e) => setFormData({ ...formData, idtraznja: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">-- Izaberi tražnju --</option>
                    {traznje.map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.id} - {getKupacIme(t)} - {t.stskupaczakupac}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Komentar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Komentar</label>
                <textarea
                  value={formData.komentar}
                  onChange={(e) => setFormData({ ...formData, komentar: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Opšti komentar o obilasku..."
                />
              </div>

              {/* Utisak kupca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Utisak kupca (1-5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, utisakkupca: star })}
                      className={`text-3xl transition-colors ${star <= formData.utisakkupca ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">({formData.utisakkupca}/5)</span>
                </div>
              </div>

              {/* Pohvale i Zamerke */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Glavne pohvale</label>
                  <textarea
                    value={formData.glavnepohvale}
                    onChange={(e) => setFormData({ ...formData, glavnepohvale: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Šta se kupcu najviše dopalo..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Glavne zamerke</label>
                  <textarea
                    value={formData.glavnezamerke}
                    onChange={(e) => setFormData({ ...formData, glavnezamerke: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Šta kupcu nije odgovaralo..."
                  />
                </div>
              </div>

              {/* Spremnost na cenu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.spremnostnacenu}
                      onChange={(e) => setFormData({ ...formData, spremnostnacenu: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Spremnost na ponuđenu cenu</span>
                  </label>
                  <input
                    type="text"
                    value={formData.spremnostnacenuopis}
                    onChange={(e) => setFormData({ ...formData, spremnostnacenuopis: e.target.value })}
                    className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Dodatni opis (npr. spreman do 95.000€)..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Način plaćanja</label>
                  <input
                    type="text"
                    value={formData.nacinplacanja}
                    onChange={(e) => setFormData({ ...formData, nacinplacanja: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Npr. keš, kredit, kombinacija..."
                  />
                </div>
              </div>

              {/* Detalji tražnje - JSONB */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  Detalji obilaska
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Neverbalna komunikacija</label>
                    <textarea
                      value={formData.detaljitraznje.neverbalna_komunikacija}
                      onChange={(e) => handleDetaljiChange('neverbalna_komunikacija', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Kako je kupac reagovao kada je ušao? Da li se nasmejao ili tražio mane?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deal-breaker faktori</label>
                    <textarea
                      value={formData.detaljitraznje.deal_breaker_faktori}
                      onChange={(e) => handleDetaljiChange('deal_breaker_faktori', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Šta bi ga definitivno odvratilo? (npr. nema lift, buka...)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Poređenje sa prethodnim</label>
                    <textarea
                      value={formData.detaljitraznje.poredjenje_sa_prethodnim}
                      onChange={(e) => handleDetaljiChange('poredjenje_sa_prethodnim', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Kako mu se čini u odnosu na prethodne nekretnine?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hitnost useljenja</label>
                    <textarea
                      value={formData.detaljitraznje.hitnost_useljenja}
                      onChange={(e) => handleDetaljiChange('hitnost_useljenja', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Koliko mu je hitno da se useli? (npr. mora do kraja meseca)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emocionalna reakcija</label>
                    <textarea
                      value={formData.detaljitraznje.emocionalna_reakcija}
                      onChange={(e) => handleDetaljiChange('emocionalna_reakcija', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Emocionalna povezanost sa nekretninom..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dodatne napomene</label>
                    <textarea
                      value={formData.detaljitraznje.dodatne_napomene}
                      onChange={(e) => handleDetaljiChange('dodatne_napomene', e.target.value)}
                      rows="2"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Bilo šta dodatno što je važno zabeležiti..."
                    />
                  </div>
                </div>
              </div>

              {/* Arhiviran */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.arhiviran}
                  onChange={(e) => setFormData({ ...formData, arhiviran: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">Arhivirano</span>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Otkaži
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Čuvam...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Sačuvaj
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
