import { useState } from 'react'
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState(initialUsers)
  const [cars, setCars] = useState(initialCars)

  const handleLogin = (user) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
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

