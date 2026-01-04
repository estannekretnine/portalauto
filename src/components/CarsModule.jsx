import { useState, useMemo, useEffect } from 'react'
import CarsList from './CarsList'
import CarForm from './CarForm'
import SearchFilters from './SearchFilters'
import { Plus, Search } from 'lucide-react'
import generateCars from '../utils/generateCars'

// Generiši 500 automobila
const initialCars = generateCars(500)

const CarsModule = ({ currentUser, users, cars: propCars, onUpdateCars }) => {
  // Koristi propCars ako postoji, inače initialCars (fallback)
  const allCars = propCars || initialCars
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12) // Prikaži 12 automobila po stranici
  const [showForm, setShowForm] = useState(false)
  const [editingCar, setEditingCar] = useState(null)
  const [showSearchFilters, setShowSearchFilters] = useState(false)
  const [filters, setFilters] = useState({
    proizvodjac: '',
    model: '',
    kmOd: '',
    kmDo: '',
  })

  // Dinamički generiši listu proizvođača iz baze
  const availableManufacturers = useMemo(() => {
    const manufacturers = [...new Set(allCars.map((car) => car.proizvodjac))]
    return manufacturers.sort()
  }, [allCars])

  // Dinamički generiši listu modela na osnovu izabranog proizvođača
  const availableModels = useMemo(() => {
    if (!filters.proizvodjac) return []
    const models = allCars
      .filter((car) => car.proizvodjac === filters.proizvodjac)
      .map((car) => car.model)
    const uniqueModels = [...new Set(models)]
    return uniqueModels.sort()
  }, [allCars, filters.proizvodjac])

  // Filtrirani automobili
  const filteredCars = useMemo(() => {
    return allCars.filter((car) => {
      // Filter po proizvođaču
      if (filters.proizvodjac && car.proizvodjac !== filters.proizvodjac) {
        return false
      }

      // Filter po modelu
      if (filters.model && car.model !== filters.model) {
        return false
      }

      // Filter po kilometraži od
      if (filters.kmOd && car.presao_km < parseInt(filters.kmOd)) {
        return false
      }

      // Filter po kilometraži do
      if (filters.kmDo && car.presao_km > parseInt(filters.kmDo)) {
        return false
      }

      return true
    })
  }, [allCars, filters])

  // Izračunaj paginaciju za filtrirane automobile
  const paginatedCars = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredCars.slice(startIndex, endIndex)
  }, [filteredCars, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredCars.length / itemsPerPage)

  // Resetuj stranicu kada se filteri promene
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const handleAdd = () => {
    setEditingCar(null)
    setShowForm(true)
  }

  const handleEdit = (car) => {
    setEditingCar(car)
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Da li ste sigurni da želite da izbrišete ovaj automobil?')) {
      onUpdateCars(allCars.filter((car) => car.id !== id))
    }
  }

  const handleSave = (carData) => {
    if (editingCar) {
      // Edit existing car
      const updatedCar = {
        ...carData,
        id: editingCar.id,
        azurirao: currentUser ? currentUser.ime : 'Nepoznato',
      }
      onUpdateCars(allCars.map((car) => (car.id === editingCar.id ? updatedCar : car)))
    } else {
      // Add new car
      const newId = Math.max(...allCars.map((c) => c.id), 0) + 1
      const newCar = {
        ...carData,
        id: newId,
        azurirao: currentUser ? currentUser.ime : 'Nepoznato',
      }
      onUpdateCars([...allCars, newCar])
      // Prebaci na poslednju stranicu gde će biti novi automobil
      const newTotalPages = Math.ceil((filteredCars.length + 1) / itemsPerPage)
      setCurrentPage(newTotalPages)
    }
    setShowForm(false)
    setEditingCar(null)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCar(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Automobili</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSearchFilters(!showSearchFilters)}
            className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150"
            title="Pretraga"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150"
          >
            <Plus className="w-5 h-5" />
            Dodaj automobil
          </button>
        </div>
      </div>

      {showForm ? (
        <CarForm
          car={editingCar}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showSearchFilters ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {showSearchFilters && (
              <SearchFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                availableManufacturers={availableManufacturers}
                availableModels={availableModels}
              />
            )}
          </div>
          <div className="mb-4 text-sm text-gray-600">
            Prikazano {paginatedCars.length} od {filteredCars.length} automobila
            {filteredCars.length !== allCars.length && (
              <span className="ml-2 text-indigo-600">
                (filtrirano iz {allCars.length} ukupno)
              </span>
            )}
          </div>
          <CarsList
            cars={paginatedCars}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          
          {/* Paginacija */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
              >
                Prethodna
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Prikaži prvu stranicu, poslednju, trenutnu i po jednu sa svake strane
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                  })
                  .map((page, index, array) => {
                    // Dodaj elipsu ako postoji razmak
                    const showEllipsis = index > 0 && page - array[index - 1] > 1
                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsis && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 border rounded-md text-sm font-medium transition duration-150 ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    )
                  })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
              >
                Sledeća
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CarsModule

