import { useState } from 'react'
import { Upload, X, Image as ImageIcon, Star, ArrowUp, ArrowDown } from 'lucide-react'

export default function PhotoUpload({ photos = [], onPhotosChange }) {
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (files) => {
    const fileArray = Array.from(files)
    const maxRedosled = photos.length > 0 ? Math.max(...photos.map(p => p.redosled || 0)) : 0
    const newPhotos = fileArray.map((file, index) => ({
      id: Date.now() + Math.random() + index,
      file,
      url: URL.createObjectURL(file),
      opis: '',
      redosled: maxRedosled + index + 1,
      glavna: photos.length === 0 && index === 0 // Prva fotografija je glavna ako nema postojećih
    }))
    
    onPhotosChange([...photos, ...newPhotos])
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removePhoto = (id) => {
    const photoToRemove = photos.find(photo => photo.id === id)
    if (photoToRemove && photoToRemove.url && photoToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.url)
    }
    const updatedPhotos = photos.filter(photo => photo.id !== id)
    onPhotosChange(updatedPhotos)
  }

  const updatePhotoDescription = (id, opis) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === id ? { ...photo, opis } : photo
    )
    onPhotosChange(updatedPhotos)
  }

  const updatePhotoRedosled = (id, redosled) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === id ? { ...photo, redosled: redosled ? parseInt(redosled) : null } : photo
    )
    onPhotosChange(updatedPhotos)
  }

  const toggleGlavna = (id) => {
    const updatedPhotos = photos.map(photo => ({
      ...photo,
      glavna: photo.id === id ? !photo.glavna : false // Samo jedna može biti glavna
    }))
    onPhotosChange(updatedPhotos)
  }

  const movePhoto = (id, direction) => {
    const index = photos.findIndex(p => p.id === id)
    if (index === -1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= photos.length) return

    const updatedPhotos = [...photos]
    const temp = updatedPhotos[index]
    updatedPhotos[index] = updatedPhotos[newIndex]
    updatedPhotos[newIndex] = temp

    // Ažuriraj redosled
    updatedPhotos.forEach((photo, idx) => {
      photo.redosled = idx + 1
    })

    onPhotosChange(updatedPhotos)
  }

  const updatePhoto = (id, newFile) => {
    const updatedPhotos = photos.map(photo => {
      if (photo.id === id) {
        if (photo.url && photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url)
        }
        return {
          ...photo,
          file: newFile,
          url: URL.createObjectURL(newFile)
        }
      }
      return photo
    })
    onPhotosChange(updatedPhotos)
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
        <label
          htmlFor="photo-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">
            Kliknite ili prevucite fotografije ovde
          </p>
          <p className="text-sm text-gray-500">
            Možete odabrati više fotografija odjednom
          </p>
        </label>
      </div>

      {photos.length > 0 && (
        <div className="space-y-4">
          {photos
            .sort((a, b) => (a.redosled || 0) - (b.redosled || 0))
            .map((photo, index) => (
            <div
              key={photo.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex gap-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={photo.url}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  {photo.glavna && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-white rounded-full p-1">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                  )}
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleGlavna(photo.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                        photo.glavna
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${photo.glavna ? 'fill-current' : ''}`} />
                      {photo.glavna ? 'Glavna' : 'Postavi kao glavnu'}
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => movePhoto(photo.id, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => movePhoto(photo.id, 'down')}
                        disabled={index === photos.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opis:
                      </label>
                      <textarea
                        value={photo.opis || ''}
                        onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
                        placeholder="Unesite opis fotografije..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        rows="2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Redosled:
                      </label>
                      <input
                        type="number"
                        value={photo.redosled || ''}
                        onChange={(e) => updatePhotoRedosled(photo.id, e.target.value)}
                        placeholder="Redosled prikaza"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zameni fotografiju:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          updatePhoto(photo.id, e.target.files[0])
                        }
                      }}
                      className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

