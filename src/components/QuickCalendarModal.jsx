import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { getCurrentUser } from '../utils/auth'
import { 
  X, 
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  Save,
  Loader2
} from 'lucide-react'
import { format, addMinutes } from 'date-fns'

export default function QuickCalendarModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tipoviDogadjaja, setTipoviDogadjaja] = useState([])
  const [formData, setFormData] = useState({
    naslov: '',
    opis: '',
    pocetak: '',
    kraj: '',
    idtipdogadjaja: null,
    tip: 'ostalo',
    ceo_dan: false,
    podseti_pre: 15,
    kontakt_ime: '',
    kontakt_telefon: ''
  })

  const currentUser = getCurrentUser()

  // Učitaj tipove događaja
  useEffect(() => {
    const loadTipoviDogadjaja = async () => {
      try {
        const { data, error } = await supabase
          .from('tipdogadjaja')
          .select('*')
          .eq('aktivan', true)
          .order('redosled', { ascending: true })

        if (error) throw error
        setTipoviDogadjaja(data || [])
        
        // Postavi prvi tip kao default
        if (data && data.length > 0) {
          setFormData(prev => ({
            ...prev,
            idtipdogadjaja: data[0].id,
            tip: data[0].naziv.toLowerCase()
          }))
        }
      } catch (error) {
        console.error('Greška pri učitavanju tipova događaja:', error)
      }
    }

    if (isOpen) {
      loadTipoviDogadjaja()
      // Resetuj formu sa trenutnim vremenom
      const now = new Date()
      setFormData(prev => ({
        ...prev,
        naslov: '',
        opis: '',
        pocetak: format(now, "yyyy-MM-dd'T'HH:mm"),
        kraj: format(addMinutes(now, 30), "yyyy-MM-dd'T'HH:mm"),
        ceo_dan: false,
        podseti_pre: 15,
        kontakt_ime: '',
        kontakt_telefon: ''
      }))
    }
  }, [isOpen])

  // Sačuvaj događaj
  const handleSave = async () => {
    try {
      if (!formData.naslov.trim()) {
        alert('Naslov je obavezan!')
        return
      }

      setSaving(true)

      const selectedTip = tipoviDogadjaja.find(t => t.id === formData.idtipdogadjaja)

      const eventData = {
        naslov: formData.naslov.trim(),
        opis: formData.opis.trim() || null,
        pocetak: new Date(formData.pocetak).toISOString(),
        kraj: new Date(formData.kraj).toISOString(),
        idtipdogadjaja: formData.idtipdogadjaja,
        tip: selectedTip ? selectedTip.naziv.toLowerCase() : 'ostalo',
        ceo_dan: formData.ceo_dan,
        podseti_pre: formData.podseti_pre,
        kontakt_ime: formData.kontakt_ime.trim() || null,
        kontakt_telefon: formData.kontakt_telefon.trim() || null,
        idkorisnik: currentUser?.id,
        kreirao: currentUser?.id,
        datumkreiranja: new Date().toISOString(),
        datumpromene: new Date().toISOString()
      }

      const { error } = await supabase
        .from('dogadjaji')
        .insert(eventData)

      if (error) throw error

      // Zatvori modal i obavesti korisnika
      onClose()
      
      // Opciono: prikaži toast notifikaciju
      alert('Događaj je uspešno kreiran!')
    } catch (error) {
      console.error('Greška pri čuvanju događaja:', error)
      alert('Greška pri čuvanju događaja: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-white" />
            <h3 className="font-bold text-white text-lg">Brzi unos događaja</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Naslov */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Naslov *
            </label>
            <input
              type="text"
              value={formData.naslov}
              onChange={(e) => setFormData({ ...formData, naslov: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Npr. Poziv sa Markom"
              autoFocus
            />
          </div>

          {/* Tip događaja */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tip događaja</label>
            <div className="grid grid-cols-3 gap-2">
              {tipoviDogadjaja.map((tip) => (
                <button
                  key={tip.id}
                  onClick={() => setFormData({ 
                    ...formData, 
                    idtipdogadjaja: tip.id,
                    tip: tip.naziv.toLowerCase()
                  })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    formData.idtipdogadjaja === tip.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: tip.boja }}
                  >
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">{tip.naziv}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Datum i vreme */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Početak *
              </label>
              <input
                type="datetime-local"
                value={formData.pocetak}
                onChange={(e) => setFormData({ ...formData, pocetak: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Kraj *
              </label>
              <input
                type="datetime-local"
                value={formData.kraj}
                onChange={(e) => setFormData({ ...formData, kraj: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Ceo dan */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.ceo_dan}
              onChange={(e) => setFormData({ ...formData, ceo_dan: e.target.checked })}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">Celodnevni događaj</span>
          </label>

          {/* Kontakt info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Kontakt ime
              </label>
              <input
                type="text"
                value={formData.kontakt_ime}
                onChange={(e) => setFormData({ ...formData, kontakt_ime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ime osobe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Kontakt telefon
              </label>
              <input
                type="tel"
                value={formData.kontakt_telefon}
                onChange={(e) => setFormData({ ...formData, kontakt_telefon: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="06x xxx xxxx"
              />
            </div>
          </div>

          {/* Podsetnik */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Podseti me pre</label>
            <select
              value={formData.podseti_pre}
              onChange={(e) => setFormData({ ...formData, podseti_pre: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={0}>Bez podsetnika</option>
              <option value={5}>5 minuta</option>
              <option value={15}>15 minuta</option>
              <option value={30}>30 minuta</option>
              <option value={60}>1 sat</option>
              <option value={1440}>1 dan</option>
            </select>
          </div>

          {/* Opis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Opis</label>
            <textarea
              value={formData.opis}
              onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="Dodatne napomene..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
          >
            Otkaži
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.naslov.trim() || !formData.pocetak || !formData.kraj || saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Kreiraj događaj
          </button>
        </div>
      </div>
    </div>
  )
}
