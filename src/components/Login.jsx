import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

const Login = ({ onLogin, users }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [buildInfo, setBuildInfo] = useState(null)

  useEffect(() => {
    // Učitaj build info
    fetch('/build-info.json')
      .then(res => res.json())
      .then(data => setBuildInfo(data))
      .catch(() => {
        // Fallback ako fajl ne postoji
        setBuildInfo({
          timestamp: new Date().toISOString(),
          date: new Date().toLocaleString('sr-RS', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Europe/Belgrade'
          }),
          version: 'dev'
        })
      })
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const user = users.find(
      (u) => u.email === email && u.password === password
    )
    
    if (user) {
      setError('')
      onLogin(user)
    } else {
      setError('Neispravan email ili šifra!')
      setEmail('')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-center mb-6" role="img" aria-label="Ikona za login">
            <div className="bg-indigo-100 p-4 rounded-full">
              <Lock className="w-8 h-8 text-indigo-600" aria-hidden="true" />
            </div>
          </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Auto Dashboard
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Unesite email"
              autoFocus
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Šifra
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Unesite šifru"
              required
            />
            {error && (
              <p className="mt-2 text-sm text-red-600" role="alert" aria-live="polite">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150"
          >
            Prijavi se
          </button>
        </form>
        
        {/* Build Info */}
        {buildInfo && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center space-y-1">
              <div>Verzija: {buildInfo.version}</div>
              <div>Build: {buildInfo.date}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login

