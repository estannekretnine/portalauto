import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns'
import { sr } from 'date-fns/locale'
import { supabase } from '../utils/supabase'
import { getCurrentUser } from '../utils/auth'
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Map, 
  Users, 
  MoreHorizontal,
  X,
  Clock,
  MapPin,
  User,
  Trash2,
  Edit,
  Bell
} from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

// Lokalizacija na srpski
const locales = { 'sr': sr }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

// Drag and Drop kalendar
const DnDCalendar = withDragAndDrop(Calendar)

// Default boje po tipu događaja (fallback)
const defaultEventColors = {
  poziv: { bg: '#3B82F6', text: '#FFFFFF', light: '#DBEAFE' },
  teren: { bg: '#10B981', text: '#FFFFFF', light: '#D1FAE5' },
  sastanak: { bg: '#8B5CF6', text: '#FFFFFF', light: '#EDE9FE' },
  ostalo: { bg: '#6B7280', text: '#FFFFFF', light: '#F3F4F6' }
}

// Poruke na srpskom
const messages = {
  allDay: 'Ceo dan',
  previous: 'Prethodni',
  next: 'Sledeći',
  today: 'Danas',
  month: 'Mesec',
  week: 'Nedelja',
  day: 'Dan',
  agenda: 'Agenda',
  date: 'Datum',
  time: 'Vreme',
  event: 'Događaj',
  noEventsInRange: 'Nema događaja u ovom periodu.',
  showMore: (total) => `+ još ${total}`
}

export default function KalendarModule() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [tipoviDogadjaja, setTipoviDogadjaja] = useState([])
  const [eventColors, setEventColors] = useState(defaultEventColors)
  const [formData, setFormData] = useState({
    naslov: '',
    opis: '',
    pocetak: '',
    kraj: '',
    tip: 'ostalo',
    idtipdogadjaja: null,
    ceo_dan: false,
    podseti_pre: 15,
    kontakt_ime: '',
    kontakt_telefon: ''
  })

  const currentUser = getCurrentUser()

  // Učitaj tipove događaja
  const loadTipoviDogadjaja = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tipdogadjaja')
        .select('*')
        .eq('aktivan', true)
        .order('redosled', { ascending: true })

      if (error) throw error
      setTipoviDogadjaja(data || [])

      // Kreiraj mapu boja iz baze
      const colorsFromDb = {}
      ;(data || []).forEach(tip => {
        colorsFromDb[tip.naziv.toLowerCase()] = {
          bg: tip.boja || '#6B7280',
          text: '#FFFFFF',
          light: tip.boja ? `${tip.boja}20` : '#F3F4F6'
        }
      })
      // Spoji sa default bojama
      setEventColors({ ...defaultEventColors, ...colorsFromDb })
    } catch (error) {
      console.error('Greška pri učitavanju tipova događaja:', error)
    }
  }, [])

  // Učitaj događaje
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('dogadjaji')
        .select(`
          *,
          vlasnici:idvlasnik (imevlasnika, kontakttelefon1),
          ponuda:idponude (naslovaoglasa, kontaktosoba),
          traznja:idtraznja (kontaktosoba, kontakttelefon)
        `)
        .order('pocetak', { ascending: true })

      if (error) throw error

      // Transformiši u format za react-big-calendar
      const formattedEvents = (data || []).map(event => ({
        id: event.id,
        title: event.naslov,
        start: new Date(event.pocetak),
        end: new Date(event.kraj),
        allDay: event.ceo_dan,
        resource: {
          ...event,
          color: eventColors[event.tip] || eventColors.ostalo
        }
      }))

      setEvents(formattedEvents)
    } catch (error) {
      console.error('Greška pri učitavanju događaja:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTipoviDogadjaja()
    loadEvents()
  }, [loadEvents, loadTipoviDogadjaja])

  // Stilizacija događaja
  const eventStyleGetter = (event) => {
    const color = event.resource?.color || defaultEventColors.ostalo
    return {
      style: {
        backgroundColor: color.bg,
        color: color.text,
        borderRadius: '8px',
        border: 'none',
        padding: '2px 8px',
        fontSize: '13px',
        fontWeight: '500'
      }
    }
  }

  // Klik na događaj
  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
  }

  // Klik na prazan slot
  const handleSelectSlot = ({ start, end }) => {
    setEditingEvent(null)
    const defaultTip = tipoviDogadjaja.length > 0 ? tipoviDogadjaja[0] : null
    setFormData({
      naslov: '',
      opis: '',
      pocetak: format(start, "yyyy-MM-dd'T'HH:mm"),
      kraj: format(end, "yyyy-MM-dd'T'HH:mm"),
      tip: defaultTip ? defaultTip.naziv.toLowerCase() : 'ostalo',
      idtipdogadjaja: defaultTip ? defaultTip.id : null,
      ceo_dan: false,
      podseti_pre: 15,
      kontakt_ime: '',
      kontakt_telefon: ''
    })
    setShowEventForm(true)
  }

  // Drag & Drop - premesti događaj
  const handleEventDrop = async ({ event, start, end }) => {
    try {
      const { error } = await supabase
        .from('dogadjaji')
        .update({
          pocetak: start.toISOString(),
          kraj: end.toISOString(),
          datumpromene: new Date().toISOString()
        })
        .eq('id', event.id)

      if (error) throw error
      loadEvents()
    } catch (error) {
      console.error('Greška pri pomeranju događaja:', error)
      alert('Greška pri pomeranju događaja: ' + error.message)
    }
  }

  // Resize događaja
  const handleEventResize = async ({ event, start, end }) => {
    try {
      const { error } = await supabase
        .from('dogadjaji')
        .update({
          pocetak: start.toISOString(),
          kraj: end.toISOString(),
          datumpromene: new Date().toISOString()
        })
        .eq('id', event.id)

      if (error) throw error
      loadEvents()
    } catch (error) {
      console.error('Greška pri promeni trajanja:', error)
      alert('Greška pri promeni trajanja: ' + error.message)
    }
  }

  // Sačuvaj događaj
  const handleSaveEvent = async () => {
    try {
      const selectedTip = tipoviDogadjaja.find(t => t.id === formData.idtipdogadjaja)
      const eventData = {
        naslov: formData.naslov,
        opis: formData.opis,
        pocetak: new Date(formData.pocetak).toISOString(),
        kraj: new Date(formData.kraj).toISOString(),
        tip: selectedTip ? selectedTip.naziv.toLowerCase() : formData.tip,
        idtipdogadjaja: formData.idtipdogadjaja,
        ceo_dan: formData.ceo_dan,
        podseti_pre: formData.podseti_pre,
        kontakt_ime: formData.kontakt_ime,
        kontakt_telefon: formData.kontakt_telefon,
        idkorisnik: currentUser?.id,
        datumpromene: new Date().toISOString()
      }

      if (editingEvent) {
        const { error } = await supabase
          .from('dogadjaji')
          .update(eventData)
          .eq('id', editingEvent.id)
        if (error) throw error
      } else {
        eventData.kreirao = currentUser?.id
        eventData.datumkreiranja = new Date().toISOString()
        const { error } = await supabase
          .from('dogadjaji')
          .insert(eventData)
        if (error) throw error
      }

      setShowEventForm(false)
      setEditingEvent(null)
      loadEvents()
    } catch (error) {
      console.error('Greška pri čuvanju događaja:', error)
      alert('Greška pri čuvanju događaja: ' + error.message)
    }
  }

  // Obriši događaj
  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj događaj?')) return

    try {
      const { error } = await supabase
        .from('dogadjaji')
        .delete()
        .eq('id', eventId)

      if (error) throw error
      setSelectedEvent(null)
      loadEvents()
    } catch (error) {
      console.error('Greška pri brisanju događaja:', error)
      alert('Greška pri brisanju događaja: ' + error.message)
    }
  }

  // Izmeni događaj
  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setFormData({
      naslov: event.resource.naslov,
      opis: event.resource.opis || '',
      pocetak: format(event.start, "yyyy-MM-dd'T'HH:mm"),
      kraj: format(event.end, "yyyy-MM-dd'T'HH:mm"),
      tip: event.resource.tip,
      idtipdogadjaja: event.resource.idtipdogadjaja || null,
      ceo_dan: event.resource.ceo_dan,
      podseti_pre: event.resource.podseti_pre || 15,
      kontakt_ime: event.resource.kontakt_ime || '',
      kontakt_telefon: event.resource.kontakt_telefon || ''
    })
    setSelectedEvent(null)
    setShowEventForm(true)
  }

  // Custom Toolbar
  const CustomToolbar = ({ label, onNavigate, onView }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Danas
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 ml-2">{label}</h2>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {['month', 'week', 'day', 'agenda'].map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                view === v 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {v === 'month' ? 'Mesec' : v === 'week' ? 'Nedelja' : v === 'day' ? 'Dan' : 'Agenda'}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setEditingEvent(null)
            const now = new Date()
            const defaultTip = tipoviDogadjaja.length > 0 ? tipoviDogadjaja[0] : null
            setFormData({
              naslov: '',
              opis: '',
              pocetak: format(now, "yyyy-MM-dd'T'HH:mm"),
              kraj: format(addMinutes(now, 30), "yyyy-MM-dd'T'HH:mm"),
              tip: defaultTip ? defaultTip.naziv.toLowerCase() : 'ostalo',
              idtipdogadjaja: defaultTip ? defaultTip.id : null,
              ceo_dan: false,
              podseti_pre: 15,
              kontakt_ime: '',
              kontakt_telefon: ''
            })
            setShowEventForm(true)
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Novi događaj</span>
        </button>
      </div>
    </div>
  )

  // Tip ikonica
  const getTypeIcon = (tip) => {
    switch (tip) {
      case 'poziv': return <Phone className="w-4 h-4" />
      case 'teren': return <Map className="w-4 h-4" />
      case 'sastanak': return <Users className="w-4 h-4" />
      default: return <MoreHorizontal className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Učitavanje kalendara...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
          <CalendarIcon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Kalendar</h2>
          <p className="text-gray-500 text-sm mt-1">Pregled i upravljanje zakazanim događajima</p>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3">
        {tipoviDogadjaja.length > 0 ? (
          tipoviDogadjaja.map((tip) => (
            <div key={tip.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tip.boja || '#6B7280' }}></div>
              <span className="text-sm font-medium text-gray-700">{tip.naziv}</span>
            </div>
          ))
        ) : (
          Object.entries(defaultEventColors).map(([tip, color]) => (
            <div key={tip} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.bg }}></div>
              <span className="text-sm font-medium text-gray-700 capitalize">{tip}</span>
            </div>
          ))
        )}
      </div>

      {/* Kalendar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <style>{`
          .rbc-calendar {
            font-family: inherit;
          }
          .rbc-header {
            padding: 12px 8px;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #F3F4F6;
          }
          .rbc-today {
            background-color: #FEF3C7 !important;
          }
          .rbc-off-range-bg {
            background-color: #F9FAFB;
          }
          .rbc-event {
            padding: 4px 8px !important;
          }
          .rbc-event:focus {
            outline: none;
          }
          .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid #F3F4F6;
          }
          .rbc-timeslot-group {
            min-height: 60px;
          }
          .rbc-current-time-indicator {
            background-color: #F59E0B;
            height: 2px;
          }
          .rbc-show-more {
            color: #F59E0B;
            font-weight: 600;
          }
          .rbc-toolbar {
            display: none;
          }
        `}</style>
        
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          selectable
          resizable
          popup
          messages={messages}
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar
          }}
          culture="sr"
        />
      </div>

      {/* Event Details Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div 
              className="px-6 py-4 flex items-center justify-between"
              style={{ backgroundColor: selectedEvent.resource?.color?.bg || '#6B7280' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {getTypeIcon(selectedEvent.resource?.tip)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedEvent.title}</h3>
                  <p className="text-white/80 text-sm capitalize">{selectedEvent.resource?.tip}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {format(selectedEvent.start, 'EEEE, d. MMMM yyyy', { locale: sr })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(selectedEvent.start, 'HH:mm')} - {format(selectedEvent.end, 'HH:mm')}
                  </p>
                </div>
              </div>

              {selectedEvent.resource?.kontakt_ime && (
                <div className="flex items-center gap-3 text-gray-600">
                  <User className="w-5 h-5 text-gray-400" />
                  <span>{selectedEvent.resource.kontakt_ime}</span>
                </div>
              )}

              {selectedEvent.resource?.kontakt_telefon && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a 
                    href={`tel:${selectedEvent.resource.kontakt_telefon}`}
                    className="text-blue-600 hover:underline"
                  >
                    {selectedEvent.resource.kontakt_telefon}
                  </a>
                </div>
              )}

              {selectedEvent.resource?.opis && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-gray-600 text-sm">{selectedEvent.resource.opis}</p>
                </div>
              )}

              {selectedEvent.resource?.podseti_pre && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <Bell className="w-4 h-4" />
                  <span>Podsetnik: {selectedEvent.resource.podseti_pre} min pre</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Obriši
              </button>
              <button
                onClick={() => handleEditEvent(selectedEvent)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Izmeni
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">
                {editingEvent ? 'Izmeni događaj' : 'Novi događaj'}
              </h3>
              <button
                onClick={() => setShowEventForm(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Naslov */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Naslov *</label>
                <input
                  type="text"
                  value={formData.naslov}
                  onChange={(e) => setFormData({ ...formData, naslov: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Npr. Poziv sa Markom"
                />
              </div>

              {/* Tip događaja */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tip događaja</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {tipoviDogadjaja.length > 0 ? (
                    tipoviDogadjaja.map((tip) => (
                      <button
                        key={tip.id}
                        onClick={() => setFormData({ 
                          ...formData, 
                          tip: tip.naziv.toLowerCase(),
                          idtipdogadjaja: tip.id 
                        })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          formData.idtipdogadjaja === tip.id 
                            ? 'border-amber-500 bg-amber-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: tip.boja || '#6B7280' }}
                        >
                          {getTypeIcon(tip.naziv.toLowerCase())}
                        </div>
                        <span className="text-xs font-medium">{tip.naziv}</span>
                      </button>
                    ))
                  ) : (
                    // Fallback ako nema tipova u bazi
                    Object.entries(defaultEventColors).map(([tip, color]) => (
                      <button
                        key={tip}
                        onClick={() => setFormData({ ...formData, tip, idtipdogadjaja: null })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          formData.tip === tip 
                            ? 'border-amber-500 bg-amber-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: color.bg }}
                        >
                          {getTypeIcon(tip)}
                        </div>
                        <span className="text-xs font-medium capitalize">{tip}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Datum i vreme */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Početak *</label>
                  <input
                    type="datetime-local"
                    value={formData.pocetak}
                    onChange={(e) => setFormData({ ...formData, pocetak: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kraj *</label>
                  <input
                    type="datetime-local"
                    value={formData.kraj}
                    onChange={(e) => setFormData({ ...formData, kraj: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Ceo dan checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ceo_dan}
                  onChange={(e) => setFormData({ ...formData, ceo_dan: e.target.checked })}
                  className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-gray-700">Celodnevni događaj</span>
              </label>

              {/* Kontakt info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kontakt ime</label>
                  <input
                    type="text"
                    value={formData.kontakt_ime}
                    onChange={(e) => setFormData({ ...formData, kontakt_ime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Ime osobe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kontakt telefon</label>
                  <input
                    type="tel"
                    value={formData.kontakt_telefon}
                    onChange={(e) => setFormData({ ...formData, kontakt_telefon: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Dodatne napomene..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowEventForm(false)}
                className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
              >
                Otkaži
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={!formData.naslov || !formData.pocetak || !formData.kraj}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingEvent ? 'Sačuvaj izmene' : 'Kreiraj događaj'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
