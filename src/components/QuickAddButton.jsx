import { useState, useEffect, useRef } from 'react'
import { Plus, MessageCircle, Calendar, X } from 'lucide-react'
import { supabase } from '../utils/supabase'

const QuickAddButton = ({ onChatClick, onCalendarClick, isChatOpen }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastReadTime, setLastReadTime] = useState(null)
  const menuRef = useRef(null)

  // Učitaj poslednje vreme čitanja iz localStorage
  useEffect(() => {
    const stored = localStorage.getItem('chat_last_read')
    if (stored) {
      setLastReadTime(new Date(stored))
    } else {
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
      .channel('chat-badge-quick')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          if (!isChatOpen) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lastReadTime, isChatOpen])

  // Kada se chat otvori, resetuj brojač
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0)
      const now = new Date().toISOString()
      localStorage.setItem('chat_last_read', now)
      setLastReadTime(new Date(now))
    }
  }, [isChatOpen])

  // Zatvori meni na klik van
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChatClick = () => {
    setIsExpanded(false)
    onChatClick()
  }

  const handleCalendarClick = () => {
    setIsExpanded(false)
    onCalendarClick()
  }

  // Ako je chat otvoren, sakrij dugme
  if (isChatOpen) {
    return null
  }

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-40">
      {/* Expanded Menu Items */}
      <div className={`
        absolute bottom-16 right-0
        flex flex-col gap-3
        transition-all duration-300 ease-out
        ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
        {/* Calendar Button */}
        <button
          onClick={handleCalendarClick}
          className="
            group flex items-center gap-3
            bg-white rounded-full shadow-lg
            pl-4 pr-5 py-3
            hover:shadow-xl
            transition-all duration-200
            border border-gray-100
          "
          title="Brzi unos u kalendar"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/30">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-700 font-medium whitespace-nowrap">
            Novi događaj
          </span>
        </button>

        {/* Chat Button */}
        <button
          onClick={handleChatClick}
          className="
            group flex items-center gap-3
            bg-white rounded-full shadow-lg
            pl-4 pr-5 py-3
            hover:shadow-xl
            transition-all duration-200
            border border-gray-100
            relative
          "
          title="Otvori chat"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/30">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-700 font-medium whitespace-nowrap">
            Zajednica
          </span>
          {/* Badge za nepročitane poruke */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 left-8 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-14 h-14 rounded-full
          bg-gradient-to-br from-amber-500 to-amber-600
          shadow-lg shadow-amber-500/30
          hover:shadow-xl hover:shadow-amber-500/40
          hover:scale-110
          transition-all duration-300
          flex items-center justify-center
          relative
        `}
        aria-label={isExpanded ? 'Zatvori meni' : 'Otvori brzi meni'}
        title="Brzi pristup"
      >
        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-45' : 'rotate-0'}`}>
          {isExpanded ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </div>
        
        {/* Badge za nepročitane poruke na glavnom dugmetu */}
        {unreadCount > 0 && !isExpanded && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}

export default QuickAddButton
