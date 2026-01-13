import { useState, useEffect } from 'react'
import { login } from '../utils/auth'
import { useNavigate } from 'react-router-dom'
import { Building2, Lock, Mail, ArrowRight } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [buildInfo, setBuildInfo] = useState(null)
  const navigate = useNavigate()

  // Prikaži build info samo u produkciji (na Vercelu)
  useEffect(() => {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    
    if (isProduction) {
      fetch('/build-info.json')
        .then(res => {
          if (!res.ok) return null
          return res.json()
        })
        .then(data => {
          if (data) {
            setBuildInfo(data)
          }
        })
        .catch(() => {})
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: loginError } = await login(email, password)

    if (loginError) {
      setError(loginError)
      setLoading(false)
      return
    }

    if (data) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-900"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative w-full max-w-md">
        {/* Logo i naslov */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-xl mb-4 border border-slate-600">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Agencija za Nekretnine
          </h1>
          <p className="text-slate-400 text-sm">
            Prijavite se na vaš nalog
          </p>
        </div>

        {/* Login forma */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email adresa
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  placeholder="vas@email.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Lozinka
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-4 rounded-xl hover:from-slate-500 hover:to-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Prijavljivanje...
                </>
              ) : (
                <>
                  Prijavi se
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Build Info */}
        {buildInfo && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <span className="text-xs font-medium text-slate-400">v{buildInfo.version}</span>
              <span className="w-px h-3 bg-slate-700"></span>
              <span className="text-xs text-slate-500">
                {(() => {
                  try {
                    const date = new Date(buildInfo.date)
                    return date.toLocaleDateString('sr-RS', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    }) + ' • ' + date.toLocaleTimeString('sr-RS', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  } catch {
                    return buildInfo.date
                  }
                })()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
