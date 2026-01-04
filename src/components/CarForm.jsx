import { useState, useEffect } from 'react'
import { Save, X } from 'lucide-react'

const CarForm = ({ car, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    proizvodjac: '',
    model: '',
    godiste: new Date().getFullYear(),
    presao_km: 0,
    slike: ['', '', '', '', ''],
  })

  useEffect(() => {
    if (car) {
      const images = [...car.slike]
      // Ensure we have exactly 5 image slots
      while (images.length < 5) {
        images.push('')
      }
      setFormData({
        proizvodjac: car.proizvodjac || '',
        model: car.model || '',
        godiste: car.godiste || new Date().getFullYear(),
        presao_km: car.presao_km || 0,
        slike: images.slice(0, 5),
      })
    }
  }, [car])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'godiste' || name === 'presao_km' ? parseInt(value) || 0 : value,
    }))
  }

  const handleImageChange = (index, value) => {
    const newSlike = [...formData.slike]
    newSlike[index] = value
    setFormData((prev) => ({
      ...prev,
      slike: newSlike,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Filter out empty image URLs
    const filteredSlike = formData.slike.filter((url) => url.trim() !== '')
    if (filteredSlike.length === 0) {
      alert('Molimo unesite barem jednu sliku!')
      return
    }
    onSave({
      ...formData,
      slike: filteredSlike,
    })
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">
        {car ? 'Izmijeni automobil' : 'Dodaj novi automobil'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="proizvodjac"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Proizvođač *
            </label>
            <input
              type="text"
              id="proizvodjac"
              name="proizvodjac"
              value={formData.proizvodjac}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="npr. Audi"
            />
          </div>

          <div>
            <label
              htmlFor="model"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Model *
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="npr. A4"
            />
          </div>

          <div>
            <label
              htmlFor="godiste"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Godište *
            </label>
            <select
              id="godiste"
              name="godiste"
              value={formData.godiste}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="presao_km"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Prešao km *
            </label>
            <input
              type="number"
              id="presao_km"
              name="presao_km"
              value={formData.presao_km}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slike (URL-ovi) * - Min. 1 slika potrebna
          </label>
          <div className="space-y-3 mb-4">
            {formData.slike.map((slika, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="url"
                    value={slika}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={`URL slike ${index + 1}`}
                  />
                </div>
                {slika.trim() && (
                  <div className="w-20 h-20 flex-shrink-0">
                    <img
                      src={slika}
                      alt={`Preview slike ${index + 1}`}
                      width="80"
                      height="80"
                      className="w-full h-full object-cover rounded-md border border-gray-300"
                      onError={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (e.target.src !== 'https://via.placeholder.com/80x80?text=Error') {
                          e.target.src = 'https://via.placeholder.com/80x80?text=Error'
                          e.target.className = 'w-full h-full object-cover rounded-md border border-red-300'
                        }
                      }}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Preview svih slika u grid-u */}
          {formData.slike.filter((url) => url.trim() !== '').length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pregled svih slika:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {formData.slike.map((slika, index) => {
                  if (!slika.trim()) return null
                  return (
                    <div key={index} className="relative">
                      <img
                        src={slika}
                        alt={`Preview slike ${index + 1}`}
                        width="200"
                        height="200"
                        className="w-full aspect-square object-cover rounded-md border-2 border-gray-300 hover:border-indigo-500 transition-colors cursor-pointer"
                        onError={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (e.target.src !== 'https://via.placeholder.com/200x200?text=Error') {
                            e.target.src = 'https://via.placeholder.com/200x200?text=Error'
                            e.target.className = 'w-full aspect-square object-cover rounded-md border-2 border-red-300'
                          }
                        }}
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150"
            aria-label={car ? 'Sačuvaj izmene automobila' : 'Dodaj novi automobil'}
          >
            <Save className="w-5 h-5" aria-hidden="true" />
            Sačuvaj
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-150"
            aria-label="Otkaži unos"
          >
            <X className="w-5 h-5" aria-hidden="true" />
            Otkaži
          </button>
        </div>
      </form>
    </div>
  )
}

export default CarForm

