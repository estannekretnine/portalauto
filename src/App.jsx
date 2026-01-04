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

function App() {
  // Učitaj sačuvane podatke iz localStorage ili koristi početne vrednosti
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedUser = getStoredData('currentUser', null)
    return storedUser !== null
  })
  const [currentUser, setCurrentUser] = useState(() => getStoredData('currentUser', null))
  const [users, setUsers] = useState(() => getStoredData('users', initialUsers))
  const [cars, setCars] = useState(() => getStoredData('cars', initialCars))

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

