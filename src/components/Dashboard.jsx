import { useState } from 'react'
import Sidebar from './Sidebar'
import CarsModule from './CarsModule'
import { LogOut, Car } from 'lucide-react'

const Dashboard = ({ onLogout }) => {
  const [activeModule, setActiveModule] = useState('cars')

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-semibold text-gray-800">
                Auto Dashboard
              </h1>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition duration-150"
            >
              <LogOut className="w-4 h-4" />
              Odjavi se
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {activeModule === 'cars' && <CarsModule />}
        </main>
      </div>
    </div>
  )
}

export default Dashboard

