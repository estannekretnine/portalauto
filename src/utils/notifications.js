import { supabase } from './supabase'
import { getCurrentUser } from './auth'

/**
 * Servis za upravljanje browser notifikacijama
 */

// Proveri da li browser podržava notifikacije
export const isNotificationSupported = () => {
  return 'Notification' in window
}

// Zatraži dozvolu za notifikacije
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Browser ne podržava notifikacije')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Prikaži notifikaciju
export const showNotification = (title, options = {}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    console.warn('Notifikacije nisu dozvoljene')
    return null
  }

  const defaultOptions = {
    icon: '/vite.svg', // Možete zameniti sa vašim logom
    badge: '/vite.svg',
    vibrate: [200, 100, 200],
    tag: 'estateflow-reminder',
    requireInteraction: true, // Ostaje dok korisnik ne klikne
    ...options
  }

  try {
    const notification = new Notification(title, defaultOptions)
    
    // Klik na notifikaciju - fokusiraj prozor
    notification.onclick = () => {
      window.focus()
      notification.close()
      if (options.onClick) {
        options.onClick()
      }
    }

    return notification
  } catch (error) {
    console.error('Greška pri prikazivanju notifikacije:', error)
    return null
  }
}

// Proveri nadolazeće događaje i prikaži podsetnike
export const checkUpcomingReminders = async () => {
  const currentUser = getCurrentUser()
  if (!currentUser) return

  try {
    const now = new Date()
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000)

    // Dohvati događaje koji počinju u narednih 30 minuta
    const { data: events, error } = await supabase
      .from('dogadjaji')
      .select('*')
      .gte('pocetak', now.toISOString())
      .lte('pocetak', thirtyMinutesLater.toISOString())
      .not('podseti_pre', 'is', null)
      .gt('podseti_pre', 0)

    if (error) throw error

    // Filtriraj događaje koji treba da dobiju podsetnik
    const eventsToNotify = (events || []).filter(event => {
      const eventStart = new Date(event.pocetak)
      const reminderTime = new Date(eventStart.getTime() - event.podseti_pre * 60 * 1000)
      
      // Proveri da li je vreme za podsetnik (±1 minut tolerancije)
      const timeDiff = Math.abs(now.getTime() - reminderTime.getTime())
      return timeDiff < 60 * 1000 // Unutar 1 minuta
    })

    // Prikaži notifikacije
    for (const event of eventsToNotify) {
      const eventStart = new Date(event.pocetak)
      const timeUntil = Math.round((eventStart.getTime() - now.getTime()) / 60000)
      
      showNotification(`⏰ ${event.naslov}`, {
        body: `Za ${timeUntil} minuta${event.kontakt_telefon ? `\n📞 ${event.kontakt_telefon}` : ''}`,
        tag: `reminder-${event.id}`,
        data: { eventId: event.id }
      })

      // Označi podsetnik kao poslat (opciono - možete implementirati tabelu podsetnici)
      console.log(`Podsetnik poslat za događaj: ${event.naslov}`)
    }

    return eventsToNotify
  } catch (error) {
    console.error('Greška pri proveri podsetnika:', error)
    return []
  }
}

// Pokreni interval za proveru podsetnika
let reminderInterval = null

export const startReminderChecker = (intervalMs = 60000) => {
  // Prvo zatraži dozvolu
  requestNotificationPermission()

  // Zaustavi prethodni interval ako postoji
  if (reminderInterval) {
    clearInterval(reminderInterval)
  }

  // Pokreni proveru odmah
  checkUpcomingReminders()

  // Pokreni interval (podrazumevano svaki minut)
  reminderInterval = setInterval(() => {
    checkUpcomingReminders()
  }, intervalMs)

  console.log('Reminder checker pokrenut')
  return reminderInterval
}

export const stopReminderChecker = () => {
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = null
    console.log('Reminder checker zaustavljen')
  }
}

// Format vremena za prikaz
export const formatReminderTime = (minutes) => {
  if (minutes === 0) return 'Bez podsetnika'
  if (minutes < 60) return `${minutes} min pre`
  if (minutes === 60) return '1 sat pre'
  if (minutes === 1440) return '1 dan pre'
  return `${Math.round(minutes / 60)} sati pre`
}

// Prikaži test notifikaciju
export const showTestNotification = () => {
  return showNotification('🔔 Test notifikacija', {
    body: 'Notifikacije rade ispravno!',
    tag: 'test-notification'
  })
}
