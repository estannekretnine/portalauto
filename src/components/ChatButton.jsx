import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { supabase } from '../utils/supabase'

const ChatButton = ({ onClick, isOpen }) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastReadTime, setLastReadTime] = useState(null)

  // Učitaj poslednje vreme čitanja iz localStorage
  useEffect(() => {
    const stored = localStorage.getItem('chat_last_read')
    if (stored) {
      setLastReadTime(new Date(stored))
    } else {
      // Ako nema sačuvanog vremena, postavi na sada
      const now = new Date().toISOString()
      localStorage.setItem('chat_last_read', now)
      setLastReadTime(new Date(now))
    }
  }, [])

  // Prebroj nepročitane poruke
  useEffect(() => {
    if (!lastReadTime) return

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', lastReadTime.toISOString())

        if (!error && count !== null) {
          setUnreadCount(count)
        }
      } catch (error) {
        console.error('Greška pri brojanju poruka:', error)
      }
    }

    fetchUnreadCount()

    // Real-time pretplata za nove poruke
    const channel = supabase
      .channel('chat-badge')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          if (!isOpen) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lastReadTime, isOpen])

  // Kada se chat otvori, resetuj brojač
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      const now = new Date().toISOString()
      localStorage.setItem('chat_last_read', now)
      setLastReadTime(new Date(now))
    }
  }, [isOpen])

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-40
        w-14 h-14 rounded-full
        bg-gradient-to-br from-amber-500 to-amber-600
        shadow-lg shadow-amber-500/30
        hover:shadow-xl hover:shadow-amber-500/40
        hover:scale-110
        transition-all duration-300
        flex items-center justify-center
        ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
      `}
      aria-label="Otvori chat"
      title="Zajednica - Globalni chat"
    >
      <MessageCircle className="w-6 h-6 text-white" />
      
      {/* Badge za nepročitane poruke */}
      {unreadCount > 0 && !isOpen && (
        <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default ChatButton
