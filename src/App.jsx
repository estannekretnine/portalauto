import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { isAuthenticated } from './utils/auth'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { initSEO, updateTitle, updateDescription, updateCanonical, updateOGUrl } from './utils/seo'
import './index.css'

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />
}

function SEOUpdater() {
  const location = useLocation()
  const baseUrl = 'https://portalauto.vercel.app'

  useEffect(() => {
    const currentPath = location.pathname
    const fullUrl = `${baseUrl}${currentPath}`

    if (currentPath === '/') {
      initSEO()
    } else if (currentPath === '/dashboard') {
      updateTitle('Dashboard - Auto Dashboard | Upravljanje automobilima')
      updateDescription('Dashboard za upravljanje automobilima. Pregled, dodavanje, izmena i brisanje automobila sa naprednim filterima i pretragom.')
      updateCanonical(fullUrl)
      updateOGUrl(fullUrl)
    }
  }, [location])

  return null
}

function App() {
  useEffect(() => {
    // Inicijalizuj SEO pri učitavanju aplikacije
    initSEO()
  }, [])

  return (
    <Router>
      <SEOUpdater />
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App

