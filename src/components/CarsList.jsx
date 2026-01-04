import { Edit, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const CarsList = ({ cars, onEdit, onDelete }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState({ carId: null, index: null })
  const [carImageIndexes, setCarImageIndexes] = useState({})

  const openImageModal = (carId, index) => {
    setSelectedImageIndex({ carId, index })
  }

  const closeImageModal = () => {
    setSelectedImageIndex({ carId: null, index: null })
  }

  const navigateImage = (direction) => {
    const car = cars.find((c) => c.id === selectedImageIndex.carId)
    if (!car) return

    let newIndex = selectedImageIndex.index + direction
    if (newIndex < 0) newIndex = car.slike.length - 1
    if (newIndex >= car.slike.length) newIndex = 0

    setSelectedImageIndex({ ...selectedImageIndex, index: newIndex })
  }

  const navigateCarImage = (carId, direction) => {
    const car = cars.find((c) => c.id === carId)
    if (!car || car.slike.length === 0) return

    const currentIndex = carImageIndexes[carId] || 0
    let newIndex = currentIndex + direction
    
    if (newIndex < 0) newIndex = car.slike.length - 1
    if (newIndex >= car.slike.length) newIndex = 0

    setCarImageIndexes({
      ...carImageIndexes,
      [carId]: newIndex,
    })
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500 text-lg">Nema automobila. Dodajte prvi automobil.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cars.map((car) => (
          <div
            key={car.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            {/* Image Gallery - prikazuje samo prvu sliku sa scroll funkcionalnostima */}
            <div className="relative bg-gray-100">
              {/* Glavna slika */}
              <div className="relative aspect-square overflow-hidden">
                {car.slike && car.slike.length > 0 ? (
                  <>
                    <img
                      src={car.slike[carImageIndexes[car.id] || 0] || car.slike[0]}
                      alt={`${car.proizvodjac} ${car.model}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageModal(car.id, carImageIndexes[car.id] || 0)}
                      onError={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const fallbackUrl = 'https://via.placeholder.com/400x400/CCCCCC/666666?text=No+Image'
                        if (e.target.src !== fallbackUrl) {
                          e.target.src = fallbackUrl
                        }
                      }}
                      loading="lazy"
                      onLoad={() => {
                        // Slika je uspešno učitana
                      }}
                    />
                    
                    {/* Navigacione strelice */}
                    {car.slike.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigateCarImage(car.id, -1)
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity z-10"
                          aria-label="Prethodna slika"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigateCarImage(car.id, 1)
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-opacity z-10"
                          aria-label="Sledeća slika"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    
                    {/* Indikator slika */}
                    {car.slike.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full">
                        {(carImageIndexes[car.id] || 0) + 1} / {car.slike.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    Nema slike
                  </div>
                )}
              </div>
              
              {/* Horizontalni scroll sa svim slikama */}
              {car.slike.length > 1 && (
                <div className="overflow-x-auto overflow-y-hidden p-2 scrollbar-hide">
                  <div className="flex gap-2" style={{ width: 'max-content' }}>
                    {car.slike.map((slika, index) => (
                      <div
                        key={index}
                        className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden cursor-pointer border-2 transition-all ${
                          (carImageIndexes[car.id] || 0) === index
                            ? 'border-indigo-500 ring-2 ring-indigo-200'
                            : 'border-transparent hover:border-gray-400'
                        }`}
                        onClick={() => {
                          setCarImageIndexes({
                            ...carImageIndexes,
                            [car.id]: index,
                          })
                        }}
                        title={`Slika ${index + 1}`}
                      >
                        <img
                          src={slika}
                          alt={`${car.proizvodjac} ${car.model} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (e.target.src !== 'https://via.placeholder.com/64x64?text=Error') {
                              e.target.src = 'https://via.placeholder.com/64x64?text=Error'
                            }
                          }}
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Car Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {car.proizvodjac} {car.model}
              </h3>
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p>
                  <span className="font-medium">Godište:</span> {car.godiste}
                </p>
                <p>
                  <span className="font-medium">Prešao km:</span>{' '}
                  {car.presao_km.toLocaleString('sr-RS')} km
                </p>
                <p>
                  <span className="font-medium">ID:</span> {car.id}
                </p>
                {car.azurirao && (
                  <p>
                    <span className="font-medium">Ažurirao:</span>{' '}
                    <span className="text-indigo-600">{car.azurirao}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(car)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition duration-150"
                >
                  <Edit className="w-4 h-4" />
                  Izmijeni
                </button>
                <button
                  onClick={() => onDelete(car.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                  Izbriši
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImageIndex.carId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative">
              <img
                src={cars.find((c) => c.id === selectedImageIndex.carId)?.slike[selectedImageIndex.index]}
                alt="Full size"
                className="max-h-[90vh] w-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (e.target.src !== 'https://via.placeholder.com/800x600?text=No+Image') {
                    e.target.src = 'https://via.placeholder.com/800x600?text=No+Image'
                  }
                }}
              />
              {cars.find((c) => c.id === selectedImageIndex.carId)?.slike.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateImage(-1)
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateImage(1)
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    →
                  </button>
                </>
              )}
            </div>
            <div className="mt-2 text-center text-white">
              Slika {selectedImageIndex.index + 1} od{' '}
              {cars.find((c) => c.id === selectedImageIndex.carId)?.slike.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CarsList

