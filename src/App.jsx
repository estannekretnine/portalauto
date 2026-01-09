import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Dashboard from './components/Dashboard'
import { initSEO, updateTitle, updateDescription, updateCanonical, updateOGUrl } from './utils/seo'
import './index.css'

function SEOUpdater() {
  const location = useLocation()
  const baseUrl = 'https://portalauto.vercel.app'

  useEffect(() => {
    const currentPath = location.pathname
    const fullUrl = `${baseUrl}${currentPath}`

    if (currentPath === '/') {
      initSEO()
    } else if (currentPath === '/dashboard') {
      updateTitle('Dashboard - Agencija za Nekretnine | Upravljanje nekretninama')
      updateDescription('Dashboard za upravljanje nekretninama. Pregled, dodavanje, izmena i brisanje vrsta objekata i korisnika sa naprednim funkcionalnostima.')
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
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
      </Routes>
    </Router>
  )
}

export default App

