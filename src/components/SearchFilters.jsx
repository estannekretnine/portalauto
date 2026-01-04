import { Search, X } from 'lucide-react'

const SearchFilters = ({ filters, onFilterChange, availableManufacturers, availableModels }) => {
  const handleClearFilters = () => {
    onFilterChange({
      proizvodjac: '',
      model: '',
      kmOd: '',
      kmDo: '',
    })
  }

  const hasActiveFilters = filters.proizvodjac || filters.model || filters.kmOd || filters.kmDo

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">Pretraga i filteri</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <X className="w-4 h-4" />
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
            value={filters.proizvodjac}
            onChange={(e) => {
              onFilterChange({
                ...filters,
                proizvodjac: e.target.value,
                model: '', // Resetuj model kada se promeni proizvođač
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

        {/* Model */}
        <div>
          <label
            htmlFor="model"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Model
          </label>
          <select
            id="model"
            value={filters.model}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                model: e.target.value,
              })
            }
            disabled={!filters.proizvodjac}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {filters.proizvodjac ? 'Svi modeli' : 'Izaberite prvo proizvođača'}
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
            value={filters.kmOd}
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
            value={filters.kmDo}
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
  )
}

export default SearchFilters

