import { useState, useEffect } from 'react'
import { getCurrentUser, logout } from '../utils/auth'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import VrstaObjektaModule from './VrstaObjektaModule'
import LokalitetModule from './LokalitetModule'
import GrejanjeModule from './GrejanjeModule'
import InvestitorModule from './InvestitorModule'
import KorisniciModule from './KorisniciModule'
import { LogOut } from 'lucide-react'

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState('vrstaobjekta')
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
          <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Agencija za Nekretnine</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
                {isAdmin && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                    Admin
                  </span>
                )}
                <span className="text-xs sm:text-sm text-gray-600 truncate">
                  {user?.naziv || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Odjavi se</span>
                  <span className="sm:hidden">Odjava</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-auto">
          {activeModule === 'vrstaobjekta' && <VrstaObjektaModule />}
          {activeModule === 'lokalitet' && <LokalitetModule />}
          {activeModule === 'grejanje' && <GrejanjeModule />}
          {activeModule === 'investitor' && <InvestitorModule />}
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

