import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import generateCars from './utils/generateCars'

// Početni korisnici
const initialUsers = [
  {
    id: 1,
    ime: 'Admin',
    email: 'admin@admin.com',
    password: 'admin123',
  },
  {
    id: 2,
    ime: 'Korisnik 1',
    email: 'korisnik1@test.com',
    password: 'test123',
  },
]

// Generiši 500 automobila
const initialCars = generateCars(500)

// Funkcije za rad sa localStorage
const getStoredData = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error)
    return defaultValue
  }
}

const setStoredData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error)
  }
}

// Migracija automobila - zameni stare Unsplash URL-ove sa novim placeholder URL-ovima
const migrateCars = (cars) => {
  const newImageUrls = [
    'https://via.placeholder.com/400x400/4F46E5/FFFFFF',
    'https://via.placeholder.com/400x400/10B981/FFFFFF',
    'https://via.placeholder.com/400x400/F59E0B/FFFFFF',
    'https://via.placeholder.com/400x400/EF4444/FFFFFF',
    'https://via.placeholder.com/400x400/8B5CF6/FFFFFF',
    'https://via.placeholder.com/400x400/06B6D4/FFFFFF',
    'https://via.placeholder.com/400x400/EC4899/FFFFFF',
    'https://via.placeholder.com/400x400/14B8A6/FFFFFF',
    'https://via.placeholder.com/400x400/F97316/FFFFFF',
    'https://via.placeholder.com/400x400/6366F1/FFFFFF',
    'https://via.placeholder.com/400x400/3B82F6/FFFFFF',
    'https://via.placeholder.com/400x400/8B5A2B/FFFFFF',
    'https://via.placeholder.com/400x400/059669/FFFFFF',
    'https://via.placeholder.com/400x400/DC2626/FFFFFF',
    'https://via.placeholder.com/400x400/7C3AED/FFFFFF'
  ]

  const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)]
  
  // Agresivna migracija - uvek zameni sve slike osim ako su već validne placeholder URL-ovi
  return cars.map((car) => {
    const hasValidPlaceholder = car.slike && 
      car.slike.length > 0 && 
      car.slike.every(url => url && url.trim() !== '' && url.includes('via.placeholder.com') && !url.includes('unsplash.com'))
    
    if (!hasValidPlaceholder) {
      // Generiši 3-5 novih validnih slika
      const numImages = Math.floor(Math.random() * 3) + 3 // 3-5 slika
      const newSlike = []
      for (let i = 0; i < numImages; i++) {
        newSlike.push(getRandomElement(newImageUrls))
      }
      return {
        ...car,
        slike: newSlike
      }
    }
    return car
  })
}

function App() {
  // Učitaj sačuvane podatke iz localStorage ili koristi početne vrednosti
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedUser = getStoredData('currentUser', null)
    return storedUser !== null
  })
  const [currentUser, setCurrentUser] = useState(() => getStoredData('currentUser', null))
  const [users, setUsers] = useState(() => getStoredData('users', initialUsers))
  const [cars, setCars] = useState(() => {
    const storedCars = getStoredData('cars', null)
    if (storedCars && storedCars.length > 0) {
      // Migriši stare automobile sa nevalidnim URL-ovima
      const migratedCars = migrateCars(storedCars)
      // Sačuvaj migrirane automobile odmah
      setTimeout(() => {
        setStoredData('cars', migratedCars)
      }, 0)
      return migratedCars
    }
    // Ako nema sačuvanih automobila, koristi početne i sačuvaj ih
    setTimeout(() => {
      setStoredData('cars', initialCars)
    }, 0)
    return initialCars
  })

  // Sačuvaj users u localStorage kada se promene
  useEffect(() => {
    setStoredData('users', users)
  }, [users])

  // Sačuvaj cars u localStorage kada se promene
  useEffect(() => {
    setStoredData('cars', cars)
  }, [cars])

  const handleLogin = (user) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
    setStoredData('currentUser', user)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('currentUser')
  }

  return (
    <>
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} users={users} />
      ) : (
        <Dashboard
          onLogout={handleLogout}
          currentUser={currentUser}
          users={users}
          onUpdateUsers={setUsers}
          cars={cars}
          onUpdateCars={setCars}
        />
      )}
    </>
  )
}

export default App

