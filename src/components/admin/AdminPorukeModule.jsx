import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { Trash2, Search, RefreshCw, MessageCircle, User, Calendar, Filter } from 'lucide-react'

const AdminPorukeModule = () => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedMessages, setSelectedMessages] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)

  // Učitaj poruke
  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju poruka:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [roleFilter])

  // Filtriraj poruke po pretrazi
  const filteredMessages = messages.filter(msg => 
    msg.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Obriši jednu poruku
  const handleDeleteMessage = async (id) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu poruku?')) return

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)

      if (error) throw error
      setMessages(prev => prev.filter(msg => msg.id !== id))
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju poruke')
    }
  }

  // Obriši selektovane poruke
  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return
    if (!confirm(`Da li ste sigurni da želite da obrišete ${selectedMessages.length} poruka?`)) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .in('id', selectedMessages)

      if (error) throw error
      setMessages(prev => prev.filter(msg => !selectedMessages.includes(msg.id)))
      setSelectedMessages([])
    } catch (error) {
      console.error('Greška pri brisanju:', error)
      alert('Greška pri brisanju poruka')
    } finally {
      setIsDeleting(false)
    }
  }

  // Toggle selekcija
  const toggleSelect = (id) => {
    setSelectedMessages(prev => 
      prev.includes(id) 
        ? prev.filter(msgId => msgId !== id)
        : [...prev, id]
    )
  }

  // Selektuj sve
  const toggleSelectAll = () => {
    if (selectedMessages.length === filteredMessages.length) {
      setSelectedMessages([])
    } else {
      setSelectedMessages(filteredMessages.map(msg => msg.id))
    }
  }

  // Formatiraj datum
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Boja uloge
  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'agent':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'prodavac':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Upravljanje porukama</h1>
              <p className="text-gray-500 text-sm">Pregled i moderacija chat poruka</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMessages}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              title="Osveži"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            {selectedMessages.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Obriši ({selectedMessages.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Filteri */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pretraži poruke ili korisnike..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Sve uloge</option>
              <option value="agent">Agent</option>
              <option value="prodavac">Prodavac</option>
              <option value="kupac">Kupac</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-gray-500 text-sm">Ukupno poruka</p>
          <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-gray-500 text-sm">Danas</p>
          <p className="text-2xl font-bold text-gray-900">
            {messages.filter(m => new Date(m.created_at).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-gray-500 text-sm">Jedinstvenih korisnika</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Set(messages.map(m => m.user_email)).size}
          </p>
        </div>
      </div>

      {/* Tabela poruka */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nema poruka za prikaz</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedMessages.length === filteredMessages.length && filteredMessages.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Korisnik</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Poruka</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Uloga</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Datum</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMessages.map((message) => (
                  <tr key={message.id} className={`hover:bg-gray-50 ${selectedMessages.includes(message.id) ? 'bg-amber-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedMessages.includes(message.id)}
                        onChange={() => toggleSelect(message.id)}
                        className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm text-gray-900 truncate max-w-[150px]">
                          {message.user_email?.split('@')[0] || 'Nepoznat'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 truncate max-w-[300px]" title={message.text}>
                        {message.text}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-lg border ${getRoleBadge(message.role)}`}>
                        {message.role || 'kupac'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(message.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Obriši poruku"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPorukeModule
