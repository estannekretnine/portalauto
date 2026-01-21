import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Edit, Building2, Save, X, FileText, MapPin, Hash } from 'lucide-react'

export default function InfoFirmaModule() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    Nazivfirme: '',
    adresa: '',
    pib: '',
    maticnibroj: '',
    brojuregistru: ''
  })

  useEffect(() => {
    loadInfo()
  }, [])

  const loadInfo = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('info')
        .select('*')
        .limit(1)
        .single()

      if (error) throw error

      setInfo(data)
      setFormData({
        Nazivfirme: data?.Nazivfirme || '',
        adresa: data?.adresa || '',
        pib: data?.pib || '',
        maticnibroj: data?.maticnibroj || '',
        brojuregistru: data?.brojuregistru || ''
      })
    } catch (error) {
      console.error('Greška pri učitavanju info podataka:', error)
      alert('Greška pri učitavanju podataka o firmi: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    // Resetuj form data na originalne vrednosti
    setFormData({
      Nazivfirme: info?.Nazivfirme || '',
      adresa: info?.adresa || '',
      pib: info?.pib || '',
      maticnibroj: info?.maticnibroj || '',
      brojuregistru: info?.brojuregistru || ''
    })
    setIsEditing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.Nazivfirme.trim()) {
      alert('Naziv firme je obavezan')
      return
    }

    try {
      setSaving(true)
      const updateData = {
        Nazivfirme: formData.Nazivfirme.trim(),
        adresa: formData.adresa.trim() || null,
        pib: formData.pib.trim() || null,
        maticnibroj: formData.maticnibroj.trim() || null,
        brojuregistru: formData.brojuregistru.trim() || null
      }

      const { error } = await supabase
        .from('info')
        .update(updateData)
        .eq('id', info.id)

      if (error) throw error

      setIsEditing(false)
      loadInfo()
    } catch (error) {
      console.error('Greška pri čuvanju podataka:', error)
      alert('Greška pri čuvanju podataka o firmi: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-12 h-12 text-gray-400" />
        </div>
        <p className="text-gray-900 text-xl font-semibold mb-2">Nema podataka o firmi</p>
        <p className="text-gray-500">Podaci o firmi nisu pronađeni u bazi.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Info - Firma</h2>
          <p className="text-gray-500 mt-1">Podaci o firmi</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium"
          >
            <Edit className="w-5 h-5" />
            <span>Izmeni podatke</span>
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Izmena podataka o firmi</h3>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Naziv firme *
                </label>
                <input
                  type="text"
                  value={formData.Nazivfirme}
                  onChange={(e) => setFormData({ ...formData, Nazivfirme: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Unesite naziv firme..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresa
                </label>
                <input
                  type="text"
                  value={formData.adresa}
                  onChange={(e) => setFormData({ ...formData, adresa: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="Unesite adresu..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    PIB
                  </label>
                  <input
                    type="text"
                    value={formData.pib}
                    onChange={(e) => setFormData({ ...formData, pib: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Unesite PIB..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Matični broj
                  </label>
                  <input
                    type="text"
                    value={formData.maticnibroj}
                    onChange={(e) => setFormData({ ...formData, maticnibroj: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Unesite matični broj..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Broj u registru
                  </label>
                  <input
                    type="text"
                    value={formData.brojuregistru}
                    onChange={(e) => setFormData({ ...formData, brojuregistru: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Unesite broj u registru..."
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/25 font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Čuvanje...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Sačuvaj izmene</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Display View */
          <div>
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-black">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{info.Nazivfirme}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Adresa */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Adresa</p>
                    <p className="text-gray-900 font-semibold">{info.adresa || '-'}</p>
                  </div>
                </div>

                {/* PIB */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Hash className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">PIB</p>
                    <p className="text-gray-900 font-semibold">{info.pib || '-'}</p>
                  </div>
                </div>

                {/* Matični broj */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Matični broj</p>
                    <p className="text-gray-900 font-semibold">{info.maticnibroj || '-'}</p>
                  </div>
                </div>

                {/* Broj u registru */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Broj u registru</p>
                    <p className="text-gray-900 font-semibold">{info.brojuregistru || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
