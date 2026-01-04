import { useState } from 'react'
import CarsList from './CarsList'
import CarForm from './CarForm'
import { Plus } from 'lucide-react'

const initialCars = [
  {
    id: 1,
    proizvodjac: 'Audi',
    model: 'A4',
    godiste: 2020,
    presao_km: 45000,
    slike: [
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400',
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400',
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400',
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400',
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400',
    ],
  },
  {
    id: 2,
    proizvodjac: 'BMW',
    model: '320d',
    godiste: 2019,
    presao_km: 68000,
    slike: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
    ],
  },
  {
    id: 3,
    proizvodjac: 'Mercedes-Benz',
    model: 'C220',
    godiste: 2021,
    presao_km: 32000,
    slike: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
    ],
  },
]

const CarsModule = () => {
  const [cars, setCars] = useState(initialCars)
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
    }
    setShowForm(false)
    setEditingCar(null)
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
        <CarsList
          cars={cars}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

export default CarsModule

