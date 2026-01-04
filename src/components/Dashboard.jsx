import { useState } from 'react'
import Sidebar from './Sidebar'
import CarsModule from './CarsModule'
import UsersModule from './UsersModule'
import { LogOut, Car } from 'lucide-react'

const Dashboard = ({ onLogout, currentUser, users, onUpdateUsers, cars, onUpdateCars }) => {
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
              {currentUser && (
                <span className="text-sm text-gray-500">
                  ({currentUser.ime})
                </span>
              )}
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition duration-150"
              aria-label="Odjavi se iz sistema"
              type="button"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Odjavi se
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6" role="main">
          {activeModule === 'cars' && (
            <CarsModule
              currentUser={currentUser}
              users={users}
              cars={cars}
              onUpdateCars={onUpdateCars}
            />
          )}
          {activeModule === 'users' && (
            <UsersModule
              users={users}
              onUpdateUsers={onUpdateUsers}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard

