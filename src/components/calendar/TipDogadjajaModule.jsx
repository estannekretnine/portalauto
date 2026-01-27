import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { 
  Tags, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  X, 
  Save,
  Phone,
  Map,
  Users,
  Calendar,
  MoreHorizontal,
  GripVertical
} from 'lucide-react'

// Mapa ikonica
const iconMap = {
  phone: Phone,
  map: Map,
  users: Users,
  calendar: Calendar,
  other: MoreHorizontal
}

// Predefinisane boje
const predefinedColors = [
  '#3B82F6', // plava
  '#10B981', // zelena
  '#8B5CF6', // ljubičasta
  '#F59E0B', // narandžasta
  '#EF4444', // crvena
  '#EC4899', // roze
  '#6B7280', // siva
  '#14B8A6', // teal
]

export default function TipDogadjajaModule() {
  const [tipoviDogadjaja, setTipoviDogadjaja] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTip, setEditingTip] = useState(null)
  const [formData, setFormData] = useState({
    naziv: '',
    boja: '#3B82F6',
    ikona: 'calendar',
    opis: '',
    aktivan: true,
    redosled: 0
  })

  // Učitaj tipove događaja
  const loadTipoviDogadjaja = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tipdogadjaja')
        .select('*')
        .order('redosled', { ascending: true })

      if (error) throw error
      setTipoviDogadjaja(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju tipova događaja:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTipoviDogadjaja()
  }, [])

  // Filtriraj tipove
  const filteredTipovi = tipoviDogadjaja.filter(tip =>
    tip.naziv.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tip.opis && tip.opis.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Otvori formu za novi tip
  const handleAddNew = () => {
    setEditingTip(null)
    setFormData({
      naziv: '',
      boja: '#3B82F6',
      ikona: 'calendar',
      opis: '',
      aktivan: true,
      redosled: tipoviDogadjaja.length
    })
    setShowForm(true)
  }

  // Otvori formu za izmenu
  const handleEdit = (tip) => {
    setEditingTip(tip)
    setFormData({
      naziv: tip.naziv,
      boja: tip.boja || '#3B82F6',
      ikona: tip.ikona || 'calendar',
      opis: tip.opis || '',
      aktivan: tip.aktivan,
      redosled: tip.redosled || 0
    })
    setShowForm(true)
  }

  // Sačuvaj tip
  const handleSave = async () => {
    try {
      if (!formData.naziv.trim()) {
        alert('Naziv je obavezan!')
        return
      }

      const tipData = {
        naziv: formData.naziv.trim(),
        boja: formData.boja,
        ikona: formData.ikona,
        opis: formData.opis.trim() || null,
        aktivan: formData.aktivan,
        redosled: formData.redosled,
        datumpromene: new Date().toISOString()
      }

      if (editingTip) {
        const { error } = await supabase
          .from('tipdogadjaja')
          .update(tipData)
          .eq('id', editingTip.id)
        if (error) throw error
      } else {
        tipData.datumkreiranja = new Date().toISOString()
        const { error } = await supabase
          .from('tipdogadjaja')
          .insert(tipData)
        if (error) throw error
      }

      setShowForm(false)
      setEditingTip(null)
      loadTipoviDogadjaja()
    } catch (error) {
      console.error('Greška pri čuvanju:', error)
      alert('Greška pri čuvanju: ' + error.message)
    }
  }

  // Obriši tip
  const handleDelete = async (tip) => {
    if (!confirm(`Da li ste sigurni da želite da obrišete tip "${tip.naziv}"?`)) return

    try {
      const { error } = await supabase
        .from('tipdogadjaja')
        .delete()
        .eq('id', tip.id)

      if (error) throw error
      loadTipoviDogadjaja()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju: ' + error.message)
    }
  }

  // Toggle aktivan status
  const handleToggleAktivan = async (tip) => {
    try {
      const { error } = await supabase
        .from('tipdogadjaja')
        .update({ 
          aktivan: !tip.aktivan,
          datumpromene: new Date().toISOString()
        })
        .eq('id', tip.id)

      if (error) throw error
      loadTipoviDogadjaja()
    } catch (error) {
      console.error('Greška pri promeni statusa:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Učitavanje tipova događaja...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Tags className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Tip događaja</h2>
            <p className="text-gray-500 text-sm mt-1">Upravljanje tipovima događaja u kalendaru</p>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
        >
          <Plus className="w-5 h-5" />
          Novi tip
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pretraži tipove događaja..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {filteredTipovi.length === 0 ? (
          <div className="p-12 text-center">
            <Tags className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nema pronađenih tipova događaja</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTipovi.map((tip) => {
              const IconComponent = iconMap[tip.ikona] || Calendar
              return (
                <div 
                  key={tip.id}
                  className={`p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4 ${!tip.aktivan ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-gray-300 cursor-move">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: tip.boja }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tip.naziv}</h3>
                      {tip.opis && (
                        <p className="text-sm text-gray-500">{tip.opis}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAktivan(tip)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        tip.aktivan 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {tip.aktivan ? 'Aktivan' : 'Neaktivan'}
                    </button>
                    <button
                      onClick={() => handleEdit(tip)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                      title="Izmeni"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tip)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-600 hover:text-red-600"
                      title="Obriši"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-white text-lg">
                {editingTip ? 'Izmeni tip događaja' : 'Novi tip događaja'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Naziv */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Naziv *</label>
                <input
                  type="text"
                  value={formData.naziv}
                  onChange={(e) => setFormData({ ...formData, naziv: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Npr. Sastanak"
                />
              </div>

              {/* Boja */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Boja</label>
                <div className="flex flex-wrap gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, boja: color })}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        formData.boja === color 
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={formData.boja}
                    onChange={(e) => setFormData({ ...formData, boja: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer"
                    title="Prilagođena boja"
                  />
                </div>
              </div>

              {/* Ikona */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ikona</label>
                <div className="flex gap-2">
                  {Object.entries(iconMap).map(([key, Icon]) => (
                    <button
                      key={key}
                      onClick={() => setFormData({ ...formData, ikona: key })}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        formData.ikona === key 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Opis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opis</label>
                <textarea
                  value={formData.opis}
                  onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Kratak opis tipa događaja..."
                />
              </div>

              {/* Aktivan */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.aktivan}
                  onChange={(e) => setFormData({ ...formData, aktivan: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Aktivan tip</span>
              </label>

              {/* Preview */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pregled</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: formData.boja }}
                  >
                    {(() => {
                      const PreviewIcon = iconMap[formData.ikona] || Calendar
                      return <PreviewIcon className="w-5 h-5" />
                    })()}
                  </div>
                  <span className="font-medium text-gray-900">
                    {formData.naziv || 'Naziv tipa'}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
              >
                Otkaži
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.naziv.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {editingTip ? 'Sačuvaj izmene' : 'Kreiraj tip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
