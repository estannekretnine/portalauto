import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './utils/auth'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import './index.css'

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <Router>
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

