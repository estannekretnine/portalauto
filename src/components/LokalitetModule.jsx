import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import DrzavaModule from './lokalitet/DrzavaModule'
import GradModule from './lokalitet/GradModule'
import OpstinaModule from './lokalitet/OpstinaModule'
import LokacijaModule from './lokalitet/LokacijaModule'
import UlicaModule from './lokalitet/UlicaModule'

export default function LokalitetModule({ activeTab: propActiveTab }) {
  const [activeTab, setActiveTab] = useState(propActiveTab || 'drzava')

  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(propActiveTab)
    }
  }, [propActiveTab])

  const tabs = [
    { id: 'drzava', label: 'Država', component: DrzavaModule },
    { id: 'grad', label: 'Grad', component: GradModule },
    { id: 'opstina', label: 'Opština', component: OpstinaModule },
    { id: 'lokacija', label: 'Lokacija', component: LokacijaModule },
    { id: 'ulica', label: 'Ulica', component: UlicaModule },
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tab Navigation - samo na desktop-u */}
      <div className="hidden md:block bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 lg:px-6 py-3 lg:py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
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
        <div className="p-4 lg:p-6">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>

      {/* Mobile View - direktno prikazuje aktivnu komponentu bez tab navigacije */}
      <div className="md:hidden">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}
