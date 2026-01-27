import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { getCurrentUser } from '../../utils/auth'
import { format, addMinutes, addDays, setHours, setMinutes } from 'date-fns'
import { sr } from 'date-fns/locale'
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Bell, 
  FileText,
  Check,
  CalendarPlus
} from 'lucide-react'

/**
 * QuickScheduleModal - Modal za brzo zakazivanje poziva/događaja iz konteksta
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Da li je modal otvoren
 * @param {function} props.onClose - Funkcija za zatvaranje modala
 * @param {Object} props.initialData - Početni podaci za popunjavanje forme
 * @param {string} props.initialData.tip - Tip događaja (poziv, teren, sastanak, ostalo)
 * @param {string} props.initialData.naslov - Predloženi naslov
 * @param {string} props.initialData.kontakt_ime - Ime kontakta
 * @param {string} props.initialData.kontakt_telefon - Telefon kontakta
 * @param {number} props.initialData.idvlasnik - ID vlasnika (opciono)
 * @param {number} props.initialData.idponude - ID ponude (opciono)
 * @param {number} props.initialData.idtraznja - ID traznje (opciono)
 * @param {function} props.onSuccess - Callback nakon uspešnog kreiranja
 */
export default function QuickScheduleModal({ 
  isOpen, 
  onClose, 
  initialData = {},
  onSuccess 
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Podrazumevani datum: sutra u 10:00
  const getDefaultDate = () => {
    const tomorrow = addDays(new Date(), 1)
    return setMinutes(setHours(tomorrow, 10), 0)
  }

  const [formData, setFormData] = useState({
    naslov: '',
    datum: format(getDefaultDate(), 'yyyy-MM-dd'),
    vreme: '10:00',
    trajanje: 30, // minuti
    napomena: '',
    podseti_pre: 15,
    tip: 'poziv'
  })

  // Popuni formu sa početnim podacima kada se modal otvori
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(prev => ({
        ...prev,
        naslov: initialData.naslov || `Poziv: ${initialData.kontakt_ime || ''}`,
        tip: initialData.tip || 'poziv',
        napomena: initialData.opis || ''
      }))
      setSuccess(false)
    }
  }, [isOpen, initialData])

  const currentUser = getCurrentUser()

  // Brzi datumi
  const quickDates = [
    { label: 'Danas', getValue: () => new Date() },
    { label: 'Sutra', getValue: () => addDays(new Date(), 1) },
    { label: 'Za 3 dana', getValue: () => addDays(new Date(), 3) },
    { label: 'Za nedelju', getValue: () => addDays(new Date(), 7) },
    { label: 'Za mesec', getValue: () => addDays(new Date(), 30) }
  ]

  // Brza vremena
  const quickTimes = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']

  // Trajanja
  const durations = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 sat' },
    { value: 120, label: '2 sata' }
  ]

  // Sačuvaj događaj
  const handleSave = async () => {
    if (!formData.naslov.trim()) {
      alert('Unesite naslov događaja')
      return
    }

    setLoading(true)
    try {
      // Kreiraj datum početka i kraja
      const [hours, minutes] = formData.vreme.split(':').map(Number)
      const startDate = new Date(formData.datum)
      startDate.setHours(hours, minutes, 0, 0)
      const endDate = addMinutes(startDate, formData.trajanje)

      const eventData = {
        naslov: formData.naslov.trim(),
        opis: formData.napomena.trim() || null,
        pocetak: startDate.toISOString(),
        kraj: endDate.toISOString(),
        tip: formData.tip,
        ceo_dan: false,
        podseti_pre: formData.podseti_pre,
        kontakt_ime: initialData.kontakt_ime || null,
        kontakt_telefon: initialData.kontakt_telefon || null,
        idvlasnik: initialData.idvlasnik || null,
        idponude: initialData.idponude || null,
        idtraznja: initialData.idtraznja || null,
        idkorisnik: currentUser?.id,
        kreirao: currentUser?.id,
        datumkreiranja: new Date().toISOString(),
        datumpromene: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('dogadjaji')
        .insert(eventData)
        .select()
        .single()

      if (error) throw error

      // Prikaži uspeh
      setSuccess(true)
      
      // Pozovi callback
      if (onSuccess) {
        onSuccess(data)
      }

      // Zatvori modal nakon 1.5 sekunde
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 1500)

    } catch (error) {
      console.error('Greška pri kreiranju događaja:', error)
      alert('Greška pri kreiranju događaja: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Prikaz uspeha
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Zakazano!</h3>
          <p className="text-gray-500">
            {format(new Date(formData.datum), 'EEEE, d. MMMM', { locale: sr })} u {formData.vreme}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <CalendarPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Zakaži poziv</h3>
              {initialData.kontakt_ime && (
                <p className="text-white/80 text-sm">{initialData.kontakt_ime}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Kontakt info (readonly) */}
          {(initialData.kontakt_ime || initialData.kontakt_telefon) && (
            <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                {initialData.kontakt_ime && (
                  <p className="font-semibold text-gray-900">{initialData.kontakt_ime}</p>
                )}
                {initialData.kontakt_telefon && (
                  <p className="text-blue-600 text-sm flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {initialData.kontakt_telefon}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Naslov */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Naslov događaja
            </label>
            <input
              type="text"
              value={formData.naslov}
              onChange={(e) => setFormData({ ...formData, naslov: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Npr. Poziv sa Markom"
            />
          </div>

          {/* Brzi izbor datuma */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Datum
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {quickDates.map((qd) => (
                <button
                  key={qd.label}
                  onClick={() => setFormData({ 
                    ...formData, 
                    datum: format(qd.getValue(), 'yyyy-MM-dd') 
                  })}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    formData.datum === format(qd.getValue(), 'yyyy-MM-dd')
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {qd.label}
                </button>
              ))}
            </div>
            <input
              type="date"
              value={formData.datum}
              onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Brzi izbor vremena */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Vreme
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {quickTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setFormData({ ...formData, vreme: time })}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    formData.vreme === time
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
            <input
              type="time"
              value={formData.vreme}
              onChange={(e) => setFormData({ ...formData, vreme: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Trajanje */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trajanje</label>
            <div className="flex gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setFormData({ ...formData, trajanje: d.value })}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    formData.trajanje === d.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Podsetnik */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Bell className="w-4 h-4 inline mr-1" />
              Podseti me pre
            </label>
            <select
              value={formData.podseti_pre}
              onChange={(e) => setFormData({ ...formData, podseti_pre: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>Bez podsetnika</option>
              <option value={5}>5 minuta pre</option>
              <option value={15}>15 minuta pre</option>
              <option value={30}>30 minuta pre</option>
              <option value={60}>1 sat pre</option>
              <option value={1440}>1 dan pre</option>
            </select>
          </div>

          {/* Napomena */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Napomena (opciono)
            </label>
            <textarea
              value={formData.napomena}
              onChange={(e) => setFormData({ ...formData, napomena: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="Dodatne beleške..."
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
            disabled={loading || !formData.naslov.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CalendarPlus className="w-5 h-5" />
                Zakaži
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
