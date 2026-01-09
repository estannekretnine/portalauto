import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Edit, Trash2, Plus, User, Phone, ToggleLeft, ToggleRight } from 'lucide-react'

export default function KorisniciModule() {
  const [korisnici, setKorisnici] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingKorisnik, setEditingKorisnik] = useState(null)
  const [formData, setFormData] = useState({
    naziv: '',
    email: '',
    password: '',
    brojmob: '',
    stsstatus: 'kupac',
    stsaktivan: 'da'
  })

  useEffect(() => {
    loadKorisnici()
  }, [])

  const loadKorisnici = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('korisnici')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error

      setKorisnici(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju korisnika:', error)
      alert('Greška pri učitavanju korisnika')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovog korisnika?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('korisnici')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadKorisnici()
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju korisnika')
    }
  }

  const handleToggleStatus = async (korisnik) => {
    try {
      const newStatus = korisnik.stsaktivan === 'da' ? 'ne' : 'da'
      
      const { error } = await supabase
        .from('korisnici')
        .update({ stsaktivan: newStatus })
        .eq('id', korisnik.id)

      if (error) throw error

      loadKorisnici()
    } catch (error) {
      console.error('Greška pri promeni statusa:', error)
      alert('Greška pri promeni statusa: ' + error.message)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('sr-RS', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Belgrade'
      })
    } catch {
      return dateString
    }
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      'kupac': 'bg-blue-100 text-blue-700',
      'prodavac': 'bg-green-100 text-green-700',
      'agent': 'bg-purple-100 text-purple-700',
      'admin': 'bg-red-100 text-red-700',
      'manager': 'bg-yellow-100 text-yellow-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const handleEdit = (korisnik) => {
    setEditingKorisnik(korisnik)
    setFormData({
      naziv: korisnik.naziv || '',
      email: korisnik.email || '',
      password: '', // Ne prikazujemo postojeći password
      brojmob: korisnik.brojmob || '',
      stsstatus: korisnik.stsstatus || 'kupac',
      stsaktivan: korisnik.stsaktivan || 'da'
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    setEditingKorisnik(null)
    setFormData({
      naziv: '',
      email: '',
      password: '',
      brojmob: '',
      stsstatus: 'kupac',
      stsaktivan: 'da'
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingKorisnik) {
        // Update
        const updateData = {
          naziv: formData.naziv,
          email: formData.email,
          brojmob: formData.brojmob || null,
          stsstatus: formData.stsstatus,
          stsaktivan: formData.stsaktivan
        }
        
        // Dodaj password samo ako je unet novi
        if (formData.password) {
          updateData.password = formData.password
        }

        const { error } = await supabase
          .from('korisnici')
          .update(updateData)
          .eq('id', editingKorisnik.id)

        if (error) throw error
      } else {
        // Create
        if (!formData.password) {
          alert('Password je obavezan za novog korisnika')
          return
        }

        const { error } = await supabase
          .from('korisnici')
          .insert([{
            naziv: formData.naziv,
            email: formData.email,
            password: formData.password,
            brojmob: formData.brojmob || null,
            stsstatus: formData.stsstatus,
            stsaktivan: formData.stsaktivan
          }])

        if (error) throw error
      }

      setShowForm(false)
      loadKorisnici()
    } catch (error) {
      console.error('Greška pri čuvanju korisnika:', error)
      alert('Greška pri čuvanju korisnika: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Učitavanje...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Korisnici</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Dodaj korisnika
        </button>
      </div>

      {korisnici.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">Nema korisnika</p>
          <p className="text-gray-500 mb-4">Dodajte prvog korisnika</p>
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Dodaj korisnika
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naziv
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktivan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kreiran
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ažuriran
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {korisnici.map((korisnik) => (
                  <tr key={korisnik.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {korisnik.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {korisnik.naziv}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {korisnik.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {korisnik.brojmob ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {korisnik.brojmob}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {korisnik.stsstatus ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(korisnik.stsstatus)}`}>
                          {korisnik.stsstatus}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleStatus(korisnik)}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg transition-colors"
                        title={`Kliknite da ${korisnik.stsaktivan === 'da' ? 'deaktivirate' : 'aktivirate'} korisnika`}
                      >
                        {korisnik.stsaktivan === 'da' ? (
                          <span className="flex items-center gap-1 text-green-600 hover:text-green-700">
                            <ToggleRight className="w-5 h-5" />
                            <span className="text-xs font-medium">Da</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 hover:text-red-700">
                            <ToggleLeft className="w-5 h-5" />
                            <span className="text-xs font-medium">Ne</span>
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(korisnik.datumk)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(korisnik.datumpt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(korisnik)}
                          className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Izmeni
                        </button>
                        <button
                          onClick={() => handleDelete(korisnik.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Obriši
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {editingKorisnik ? 'Izmeni korisnika' : 'Dodaj novog korisnika'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naziv *
                </label>
                <input
                  type="text"
                  value={formData.naziv}
                  onChange={(e) => setFormData({ ...formData, naziv: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Broj telefona
                </label>
                <input
                  type="tel"
                  value={formData.brojmob}
                  onChange={(e) => setFormData({ ...formData, brojmob: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="+381 60 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.stsstatus}
                  onChange={(e) => setFormData({ ...formData, stsstatus: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="kupac">Kupac</option>
                  <option value="prodavac">Prodavac</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aktivan *
                </label>
                <select
                  value={formData.stsaktivan}
                  onChange={(e) => setFormData({ ...formData, stsaktivan: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="da">Da</option>
                  <option value="ne">Ne</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingKorisnik ? '(ostavite prazno da zadržite postojeći)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingKorisnik}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={editingKorisnik ? 'Nova password (opciono)' : 'Password'}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingKorisnik ? 'Sačuvaj izmene' : 'Kreiraj korisnika'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

