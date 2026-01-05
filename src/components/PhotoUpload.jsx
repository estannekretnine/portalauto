import { useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export default function PhotoUpload({ photos = [], onPhotosChange }) {
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (files) => {
    const fileArray = Array.from(files)
    const newPhotos = fileArray.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      opis: ''
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="relative mb-3">
                <img
                  src={photo.url}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Opis fotografije:
                </label>
                <textarea
                  value={photo.opis || ''}
                  onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
                  placeholder="Unesite opis..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows="2"
                />
                
                <label className="block text-sm font-medium text-gray-700 mt-2">
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
          ))}
        </div>
      )}
    </div>
  )
}

