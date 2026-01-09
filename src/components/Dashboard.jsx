import { useState } from 'react'
import Sidebar from './Sidebar'
import VrstaObjektaModule from './VrstaObjektaModule'
import LokalitetModule from './LokalitetModule'
import KorisniciModule from './KorisniciModule'

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState('vrstaobjekta')
  
  const isAdmin = true // Admin pristup za sve

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        user={null}
      />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Agencija za Nekretnine</h1>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {activeModule === 'vrstaobjekta' && <VrstaObjektaModule />}
          {(activeModule === 'lokalitet-drzava' || 
            activeModule === 'lokalitet-grad' || 
            activeModule === 'lokalitet-opstina' || 
            activeModule === 'lokalitet-lokacija' || 
            activeModule === 'lokalitet-ulica') && <LokalitetModule activeTab={activeModule.replace('lokalitet-', '')} />}
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

