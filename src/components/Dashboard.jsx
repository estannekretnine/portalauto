import { useState, useEffect } from 'react'
import { getCurrentUser, logout } from '../utils/auth'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import VrstaObjektaModule from './VrstaObjektaModule'
import GrejanjeModule from './GrejanjeModule'
import InvestitorModule from './InvestitorModule'
import InfoFirmaModule from './InfoFirmaModule'
import MedijiModule from './MedijiModule'
import KorisniciModule from './KorisniciModule'
import DrzavaModule from './lokalitet/DrzavaModule'
import GradModule from './lokalitet/GradModule'
import OpstinaModule from './lokalitet/OpstinaModule'
import LokacijaModule from './lokalitet/LokacijaModule'
import UlicaModule from './lokalitet/UlicaModule'
import PonudeModule from './PonudeModule'
import TraznjaModule from './TraznjaModule'
import PoziviModule from './PoziviModule'
import WelcomeDashboard from './WelcomeDashboard'
import EOPModule from './izvestaji/EOPModule'
import EOKModule from './izvestaji/EOKModule'
import TransakcijeModule from './izvestaji/TransakcijeModule'
import MesecniPregledModule from './izvestaji/MesecniPregledModule'
import AnalizaPozivModule from './izvestaji/AnalizaPozivModule'
import AnalizaMedijaModule from './izvestaji/AnalizaMedijaModule'
import StatistikaTerenModule from './izvestaji/StatistikaTerenModule'
import ProdajaRentaModule from './izvestaji/ProdajaRentaModule'
import ArhiviraniOglasiModule from './izvestaji/ArhiviraniOglasiModule'
import TereniModule from './TereniModule'
import ProveraModule from './ProveraModule'
import ScrapingHaloBeogradModule from './scraping/ScrapingHaloBeogradModule'
import VlasniciModule from './scraping/VlasniciModule'
import VremeTrajanjModule from './scraping/VremeTrajanjModule'
import ScrapingConfigModule from './scraping/ScrapingConfigModule'
import NacinDobijanjaModule from './NacinDobijanjaModule'
import AnalizaNacinaDobijanjaModule from './izvestaji/AnalizaNacinaDobijanjaModule'
import { LogOut, Menu, Building2 } from 'lucide-react'

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState(null)
  const [user, setUser] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
    // Redirekcija na početnu stranicu - koristi window.location za potpuno reset
    window.location.href = 'https://portalauto.vercel.app/'
  }

  const isAdmin = user?.email === 'admin@example.com'

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        user={user}
        collapsed={sidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="bg-white shadow-lg border-b border-gray-100">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2.5 bg-gradient-to-br from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 rounded-xl transition-all shadow-md hover:shadow-lg border border-white/10"
                  title={sidebarCollapsed ? 'Proširi navigaciju' : 'Smanji navigaciju'}
                  aria-label={sidebarCollapsed ? 'Proširi navigaciju' : 'Smanji navigaciju'}
                >
                  <Menu className="w-5 h-5 text-white" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl items-center justify-center shadow-md shadow-amber-500/20">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">EstateFlow</h1>
                    <p className="text-xs text-gray-500 hidden sm:block">Premium Real Estate Platform</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {isAdmin && (
                  <span className="text-xs bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 px-3 py-1.5 rounded-lg font-semibold border border-amber-300/50">
                    Admin
                  </span>
                )}
                <span className="text-sm text-gray-600 truncate font-medium">
                  {user?.naziv || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium border border-transparent hover:border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Odjavi se</span>
                  <span className="sm:hidden">Odjava</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {!activeModule && <WelcomeDashboard />}
          {activeModule === 'ponude' && <PonudeModule />}
          {activeModule === 'traznja' && <TraznjaModule />}
          {activeModule === 'pozivi' && <PoziviModule />}
          {activeModule === 'tereni' && <TereniModule />}
          {activeModule === 'provera' && <ProveraModule />}
          {activeModule === 'izvestaj-eop' && <EOPModule />}
          {activeModule === 'izvestaj-eok' && <EOKModule />}
          {activeModule === 'izvestaj-transakcije' && <TransakcijeModule />}
          {activeModule === 'izvestaj-mesecni' && <MesecniPregledModule />}
          {activeModule === 'izvestaj-pozivi' && <AnalizaPozivModule />}
          {activeModule === 'izvestaj-mediji' && <AnalizaMedijaModule />}
          {activeModule === 'izvestaj-nacin-dobijanja' && <AnalizaNacinaDobijanjaModule />}
          {activeModule === 'izvestaj-tereni' && <StatistikaTerenModule />}
          {activeModule === 'izvestaj-prodaja-renta' && <ProdajaRentaModule />}
          {activeModule === 'izvestaj-arhivirani' && <ArhiviraniOglasiModule />}
          {activeModule === 'izvestaj-transakcije-placeholder' && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                <span className="text-3xl">💰</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Izvršene transakcije</h2>
              <p className="text-gray-500">Pregled izvršenih transakcija - modul u pripremi...</p>
            </div>
          )}
          {activeModule === 'vrstaobjekta' && <VrstaObjektaModule />}
          {activeModule === 'lokalitet-drzava' && <DrzavaModule />}
          {activeModule === 'lokalitet-grad' && <GradModule />}
          {activeModule === 'lokalitet-opstina' && <OpstinaModule />}
          {activeModule === 'lokalitet-lokacija' && <LokacijaModule />}
          {activeModule === 'lokalitet-ulica' && <UlicaModule />}
          {activeModule === 'grejanje' && <GrejanjeModule />}
          {activeModule === 'investitor' && <InvestitorModule />}
          {activeModule === 'info-firma' && <InfoFirmaModule />}
          {activeModule === 'mediji' && <MedijiModule />}
          {activeModule === 'nacin-dobijanja' && <NacinDobijanjaModule />}
          {activeModule === 'korisnici' && (isAdmin ? <KorisniciModule /> : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">Nemate pristup ovom modulu.</p>
              <p className="text-gray-500">Samo admin korisnici mogu pristupiti modulu Korisnici.</p>
            </div>
          ))}
          {activeModule === 'scraping-config' && <ScrapingConfigModule />}
          {activeModule === 'scraping-halo-beograd-stan' && <ScrapingHaloBeogradModule />}
          {activeModule === 'scraping-vlasnici' && <VlasniciModule />}
          {activeModule === 'scraping-vreme-trajanja' && <VremeTrajanjModule />}
        </main>
      </div>
    </div>
  )
}

