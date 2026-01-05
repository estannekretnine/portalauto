import { useState, useEffect } from 'react'
import { getCurrentUser, logout } from '../utils/auth'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import AutoModule from './AutoModule'
import KorisniciModule from './KorisniciModule'
import { LogOut } from 'lucide-react'

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState('auto')
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/')
      return
    }
    setUser(currentUser)
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isAdmin = user?.email === 'admin@example.com'

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        user={user}
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Auto Dashboard</h1>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                    Admin
                  </span>
                )}
                <span className="text-sm text-gray-600">
                  {user?.naziv || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Odjavi se
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {activeModule === 'auto' && <AutoModule />}
          {activeModule === 'korisnici' && (isAdmin ? <KorisniciModule /> : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">Nemate pristup ovom modulu.</p>
              <p className="text-gray-500">Samo admin korisnici mogu pristupiti modulu Korisnici.</p>
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}

