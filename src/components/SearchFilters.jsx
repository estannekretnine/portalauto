import { Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const SearchFilters = ({ filters, onFilterChange, availableManufacturers, availableModels }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleClearFilters = () => {
    onFilterChange({
      proizvodjac: '',
      marka: '',
      kmOd: '',
      kmDo: '',
    })
  }

  const hasActiveFilters = filters.proizvodjac || filters.marka || filters.kmOd || filters.kmDo

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      {/* Header sa lupom - klikom se otvara/zatvara */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        type="button"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-800">Pretraga i filteri</h2>
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
              Aktivno
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" aria-hidden="true" />
        )}
      </button>

      {/* Filteri - prikazuju se samo kada je otvoreno */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="pt-4 flex justify-end mb-4">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                aria-label="Obriši sve aktivne filtere"
                type="button"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Obriši filtere
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Proizvođač */}
            <div>
              <label
                htmlFor="proizvodjac"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Proizvođač
              </label>
              <select
                id="proizvodjac"
                value={filters.proizvodjac || ''}
                onChange={(e) => {
                  onFilterChange({
                    ...filters,
                    proizvodjac: e.target.value,
                    marka: '', // Resetuj marku kada se promeni proizvođač
                  })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Svi proizvođači</option>
                {availableManufacturers.map((manufacturer) => (
                  <option key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </option>
                ))}
              </select>
            </div>

            {/* Marka */}
            <div>
              <label
                htmlFor="marka"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Marka
              </label>
              <select
                id="marka"
                value={filters.marka || ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    marka: e.target.value,
                  })
                }
                disabled={!filters.proizvodjac}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {filters.proizvodjac ? 'Sve marke' : 'Izaberite prvo proizvođača'}
                </option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            {/* Kilometraža od */}
            <div>
              <label
                htmlFor="kmOd"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Kilometraža od
              </label>
              <input
                type="number"
                id="kmOd"
                value={filters.kmOd || ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    kmOd: e.target.value,
                  })
                }
                min="0"
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Kilometraža do */}
            <div>
              <label
                htmlFor="kmDo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Kilometraža do
              </label>
              <input
                type="number"
                id="kmDo"
                value={filters.kmDo || ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    kmDo: e.target.value,
                  })
                }
                min="0"
                placeholder="200000"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchFilters

