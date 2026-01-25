import { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle, Users } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { getCurrentUser } from '../utils/auth'

const GlobalChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)
  const user = getCurrentUser()

  // Boje prema ulozi
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'agent':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
      case 'prodavac':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'kupac':
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'agent':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'prodavac':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'kupac':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleLabel = (role) => {
    switch (role?.toLowerCase()) {
      case 'agent':
        return 'Agent'
      case 'prodavac':
        return 'Prodavac'
      case 'kupac':
      default:
        return 'Kupac'
    }
  }

  // Scroll na dno
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Učitaj poruke
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Greška pri učitavanju poruka:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Real-time pretplata
  useEffect(() => {
    if (!isOpen) return

    fetchMessages()

    const channel = supabase
      .channel('global-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen])

  // Auto-scroll kada stignu nove poruke
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Pošalji poruku
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return

    if (!user) {
      alert('Morate biti prijavljeni da biste slali poruke.')
      return
    }

    setIsSending(true)
    try {
      const { error } = await supabase.from('messages').insert({
        text: newMessage.trim(),
        user_id: user.id,
        user_email: user.email,
        role: user.role || 'kupac'
      })

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Greška pri slanju poruke:', error)
      alert('Greška pri slanju poruke. Pokušajte ponovo.')
    } finally {
      setIsSending(false)
    }
  }

  // Formatiraj vreme
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Juče ' + date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' }) + ' ' + 
             date.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Izvuci inicijale iz email-a
  const getInitials = (email) => {
    if (!email) return '?'
    const name = email.split('@')[0]
    return name.substring(0, 2).toUpperCase()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay za mobile */}
      <div 
        className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Chat panel */}
      <div className={`
        fixed z-50 bg-white shadow-2xl flex flex-col
        lg:bottom-4 lg:right-4 lg:w-96 lg:h-[500px] lg:rounded-2xl
        inset-0 lg:inset-auto
        animate-in slide-in-from-bottom-4 duration-300
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-900 to-black text-white lg:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Zajednica</h3>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Globalni chat</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            aria-label="Zatvori chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
              <p>Nema poruka</p>
              <p className="text-sm">Budite prvi koji će započeti razgovor!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = user && message.user_id === user.id
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${getRoleColor(message.role)}`}>
                    {getInitials(message.user_email)}
                  </div>

                  {/* Message content */}
                  <div className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {message.user_email?.split('@')[0] || 'Korisnik'}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getRoleBadgeColor(message.role)}`}>
                        {getRoleLabel(message.role)}
                      </span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl ${
                      isOwnMessage 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-br-md' 
                        : 'bg-white shadow-sm border border-gray-100 rounded-bl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white lg:rounded-b-2xl">
          {!user ? (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500 mb-2">Prijavite se da biste slali poruke</p>
              <button
                type="button"
                onClick={onClose}
                className="text-amber-600 hover:text-amber-700 font-medium text-sm"
              >
                Zatvori chat
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Napišite poruku..."
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm"
                disabled={isSending}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20"
                aria-label="Pošalji poruku"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  )
}

export default GlobalChat
