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

// Migracija automobila - zameni stare URL-ove sa novim data URI placeholder slikama
const migrateCars = (cars) => {
  // Generiši placeholder slike
  const generatePlaceholderImage = (width, height, color, textColor = '#FFFFFF') => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
    
    ctx.fillStyle = textColor
    ctx.font = `${Math.floor(width / 8)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Car', width / 2, height / 2)
    
    return canvas.toDataURL('image/png')
  }

  const colors = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
    '#3B82F6', '#8B5A2B', '#059669', '#DC2626', '#7C3AED'
  ]
  
  const imageUrls = colors.map(color => generatePlaceholderImage(400, 400, color))
  const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)]
  
  // Agresivna migracija - uvek zameni sve slike osim ako su već validne data URI slike
  return cars.map((car) => {
    const hasValidDataUri = car.slike && 
      car.slike.length > 0 && 
      car.slike.every(url => url && url.trim() !== '' && (url.startsWith('data:image') || url.includes('via.placeholder.com')))
    
    if (!hasValidDataUri) {
      // Generiši 3-5 novih validnih slika
      const numImages = Math.floor(Math.random() * 3) + 3 // 3-5 slika
      const newSlike = []
      for (let i = 0; i < numImages; i++) {
        newSlike.push(getRandomElement(imageUrls))
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
      // Proveri da li imaju validne slike
      const allHaveValidImages = storedCars.every(car => {
        if (!car.slike || car.slike.length === 0) return false
        return car.slike.every(url => url && url.trim() !== '' && (url.startsWith('http') || url.startsWith('data:')))
      })
      
      if (allHaveValidImages) {
        return storedCars
      } else {
        console.log('Cars have invalid images, generating new ones...')
        localStorage.removeItem('cars')
      }
    }
    
    console.log('Generating new cars with valid images...')
    return initialCars
  })

  // Sačuvaj users u localStorage kada se promene
  useEffect(() => {
    setStoredData('users', users)
  }, [users])

  // Sačuvaj cars u localStorage kada se promene
  useEffect(() => {
    if (cars && cars.length > 0) {
      setStoredData('cars', cars)
    }
  }, [cars])

  // Sačuvaj automobile u localStorage
  useEffect(() => {
    if (cars && cars.length > 0) {
      setStoredData('cars', cars)
    }
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

