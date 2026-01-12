import { useMemo, useState } from 'react'
import { Upload, X, Image as ImageIcon, Star, ArrowUp, ArrowDown } from 'lucide-react'

export default function PhotoUpload({ photos = [], onPhotosChange }) {
  const [dragActive, setDragActive] = useState(false)
  const [previewSegment, setPreviewSegment] = useState(null)
  const [photoHoverSegment, setPhotoHoverSegment] = useState(null)

  const handleFiles = (files) => {
    const fileArray = Array.from(files)
    const maxRedosled = photos.length > 0 ? Math.max(...photos.map(p => p.redosled || 0)) : 0
    const newPhotos = fileArray.map((file, index) => ({
      id: Date.now() + Math.random() + index,
      file,
      url: URL.createObjectURL(file),
      opis: '',
      redosled: maxRedosled + index + 1,
      glavna: photos.length === 0 && index === 0, // Prva fotografija je glavna ako nema postojećih
      stsskica: false // Podrazumevano nije skica
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
    e.preventDefault()
    e.stopPropagation()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
    // Resetuj input da bi mogao da se ponovo izabere isti fajl
    e.target.value = ''
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

  const toggleStsskica = (id) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === id ? { ...photo, stsskica: !photo.stsskica } : photo
    )
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

    // A┼╛uriraj redosled
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

  const getSegmentLabel = (value) => {
    const trimmed = (value || '').trim()
    return trimmed || 'Nepovezano'
  }

  const segmentsSummary = useMemo(() => {
    const summary = new Map()
    photos.forEach(photo => {
      const label = getSegmentLabel(photo.skica_segment)
      if (!summary.has(label)) {
        summary.set(label, { name: label, photos: [] })
      }
      summary.get(label).photos.push(photo)
    })
    return Array.from(summary.values())
  }, [photos])

  const segmentOptions = useMemo(() => {
    const names = segmentsSummary.map(segment => segment.name)
    return Array.from(new Set(names))
  }, [segmentsSummary])

  const updatePhotoSegment = (id, segment) => {
    const trimmed = segment ? segment.trim() : ''
    const updatedPhotos = photos.map(photo =>
      photo.id === id ? { ...photo, skica_segment: trimmed } : photo
    )
    onPhotosChange(updatedPhotos)
  }

  const updatePhotoCoords = (id, coords) => {
    const updatedPhotos = photos.map(photo =>
      photo.id === id ? { ...photo, skica_coords: coords } : photo
    )
    onPhotosChange(updatedPhotos)
  }

  const previewPhotos = previewSegment
    ? (segmentsSummary.find(segment => segment.name === previewSegment)?.photos || [])
    : []
  const activeSegment = previewSegment || photoHoverSegment

  return (
    <div 
      className="space-y-4"
      data-photo-upload="true"
      onClick={(e) => {
        // Zaustavi propagaciju svih klikova unutar PhotoUpload komponente
        e.stopPropagation()
      }}
      onKeyDown={(e) => {
        // Spre─ìi submit na Enter key
        if (e.key === 'Enter') {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
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
          onClick={(e) => {
            // Spre─ìi da se forma submit-uje ako se klikne na label
            e.stopPropagation()
          }}
        >
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">
            Kliknite ili prevucite fotografije ovde
          </p>
          <p className="text-sm text-gray-500">
            Mo┼╛ete odabrati vi┼íe fotografija odjednom
          </p>
        </label>
      </div>

      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Segmenti skice</p>
              <span className="text-xs text-gray-500">Hover da vidiš povezane fotke</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {segmentsSummary.map(segment => {
                const isActive = activeSegment === segment.name
                const previewPhoto = segment.photos[0]
                return (
                  <button
                    key={segment.name}
                    type="button"
                    onMouseEnter={() => setPreviewSegment(segment.name)}
                    onMouseLeave={() => setPreviewSegment(null)}
                    className={`relative w-full text-left rounded-lg border p-3 transition ${isActive ? 'border-indigo-500 bg-white shadow-lg' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{segment.name}</p>
                        <p className="text-xs text-gray-500">{segment.photos.length} fotografija</p>
                        {previewPhoto?.skica_coords && (
                          <p className="text-[10px] text-gray-400">Koord: {previewPhoto.skica_coords}</p>
                        )}
                      </div>
                      {previewPhoto?.url ? (
                        <img
                          src={previewPhoto.url}
                          alt={segment.name}
                          className="h-12 w-12 rounded-md object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                          nema
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            {previewPhotos.length > 0 && (
              <div className="border border-gray-200 rounded-lg bg-gray-50 p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {previewPhotos.slice(0, 6).map(photo => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={photo.opis || 'Preview'}
                    className="h-20 w-full object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>
          {photos
            .sort((a, b) => (a.redosled || 0) - (b.redosled || 0))
            .map((photo, index) => {
              const photoSegmentName = getSegmentLabel(photo.skica_segment)
              const isPhotoActive = activeSegment === photoSegmentName
              return (
                <div
                  key={photo.id}
                  onMouseEnter={() => setPhotoHoverSegment(photoSegmentName)}
                  onMouseLeave={() => setPhotoHoverSegment(null)}
                  className={`border rounded-lg p-4 bg-white shadow-sm transition ${isPhotoActive ? 'border-indigo-500 shadow-lg' : 'border-gray-200'}`}
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
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removePhoto(photo.id)
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleGlavna(photo.id)
                          }}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                            photo.glavna
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${photo.glavna ? 'fill-current' : ''}`} />
                          {photo.glavna ? 'Glavna' : 'Postavi kao glavnu'}
                        </button>
                        
                        <label className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={photo.stsskica || false}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleStsskica(photo.id)
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">Skica</span>
                        </label>
                        
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              movePhoto(photo.id, 'up')
                            }}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              movePhoto(photo.id, 'down')
                            }}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Segment skice
                          </label>
                          <input
                            type="text"
                            list="skica-segment-options"
                            value={photo.skica_segment || ''}
                            onChange={(e) => updatePhotoSegment(photo.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="npr. Kuhinja, Dnevna soba"
                          />
                          <datalist id="skica-segment-options">
                            {segmentOptions.map(option => (
                              <option key={option} value={option} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Koordinate segmenta
                          </label>
                          <input
                            type="text"
                            value={photo.skica_coords || ''}
                            onChange={(e) => updatePhotoCoords(photo.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="npr. 120,230;150,260"
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
                            e.preventDefault()
                            e.stopPropagation()
                            if (e.target.files && e.target.files[0]) {
                              updatePhoto(photo.id, e.target.files[0])
                            }
                            e.target.value = '' // Reset input
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

