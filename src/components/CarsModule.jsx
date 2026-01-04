import { useState, useMemo } from 'react'
import CarsList from './CarsList'
import CarForm from './CarForm'
import { Plus } from 'lucide-react'
import generateCars from '../utils/generateCars'

// Generiši 500 automobila
const initialCars = generateCars(500)

const CarsModule = () => {
  const [cars, setCars] = useState(initialCars)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12) // Prikaži 12 automobila po stranici

  // Izračunaj paginaciju
  const paginatedCars = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return cars.slice(startIndex, endIndex)
  }, [cars, currentPage, itemsPerPage])

  const totalPages = Math.ceil(cars.length / itemsPerPage)
  const [showForm, setShowForm] = useState(false)
  const [editingCar, setEditingCar] = useState(null)

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
      setCars(cars.filter((car) => car.id !== id))
    }
  }

  const handleSave = (carData) => {
    if (editingCar) {
      // Edit existing car
      setCars(cars.map((car) => (car.id === editingCar.id ? { ...carData, id: editingCar.id } : car)))
    } else {
      // Add new car
      const newId = Math.max(...cars.map((c) => c.id), 0) + 1
      setCars([...cars, { ...carData, id: newId }])
      // Prebaci na poslednju stranicu gde će biti novi automobil
      const newTotalPages = Math.ceil((cars.length + 1) / itemsPerPage)
      setCurrentPage(newTotalPages)
    }
    setShowForm(false)
    setEditingCar(null)
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
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150"
        >
          <Plus className="w-5 h-5" />
          Dodaj automobil
        </button>
      </div>

      {showForm ? (
        <CarForm
          car={editingCar}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Prikazano {paginatedCars.length} od {cars.length} automobila
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

