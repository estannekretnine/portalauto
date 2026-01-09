import { useState } from 'react'
import { MapPin } from 'lucide-react'
import DrzavaModule from './lokalitet/DrzavaModule'
import GradModule from './lokalitet/GradModule'
import OpstinaModule from './lokalitet/OpstinaModule'
import LokacijaModule from './lokalitet/LokacijaModule'
import UlicaModule from './lokalitet/UlicaModule'

export default function LokalitetModule() {
  const [activeTab, setActiveTab] = useState('drzava')

  const tabs = [
    { id: 'drzava', label: 'Država', component: DrzavaModule },
    { id: 'grad', label: 'Grad', component: GradModule },
    { id: 'opstina', label: 'Opština', component: OpstinaModule },
    { id: 'lokacija', label: 'Lokacija', component: LokacijaModule },
    { id: 'ulica', label: 'Ulica', component: UlicaModule },
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="w-8 h-8 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">Lokalitet</h2>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  )
}
