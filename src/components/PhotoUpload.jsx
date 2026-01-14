import { useMemo, useState, useRef, useCallback } from 'react'
import { Upload, X, Star, ArrowUp, ArrowDown, MapPin, Eye, Layers, Play } from 'lucide-react'
import GalleryPreview from './GalleryPreview'

export default function PhotoUpload({ photos = [], onPhotosChange }) {
  const [dragActive, setDragActive] = useState(false)
  const [activeSketchId, setActiveSketchId] = useState(null)
  const [selectedPhotoForLink, setSelectedPhotoForLink] = useState(null)
  const [hoveredMarker, setHoveredMarker] = useState(null)
  const [hoverPosition, setHoverPosition] = useState(null) // { x, y, nearestPhoto }
  const [showPreview, setShowPreview] = useState(false) // Za prikaz GalleryPreview
  const sketchContainerRef = useRef(null)
  const photoRefs = useRef({}) // Reference za svaku fotografiju za skrolovanje

  // Fotografije koje su označene kao skice
  const sketchPhotos = useMemo(() => {
    return photos.filter(p => p.stsskica)
  }, [photos])

  // Fotografije koje NISU skice (obične fotografije)
  const regularPhotos = useMemo(() => {
    return photos.filter(p => !p.stsskica)
  }, [photos])

  // Parsiranje koordinata iz stringa u objekat
  // Format: "sketchId:x,y;sketchId2:x2,y2"
  const parseCoords = (coordsString) => {
    if (!coordsString) return []
    const coords = []
    const parts = coordsString.split(';').filter(Boolean)
    parts.forEach(part => {
      // Regex koji hvata decimalne ID-eve (npr. 1736849123456.789:50.5,30.2)
      const match = part.match(/^([\d.]+):([\d.]+),([\d.]+)$/)
      if (match) {
        coords.push({
          sketchId: parseFloat(match[1]),
          x: parseFloat(match[2]),
          y: parseFloat(match[3])
        })
      }
    })
    return coords
  }

  // Dobijanje markera za određenu skicu
  const getMarkersForSketch = (sketchId) => {
    const markers = []
    regularPhotos.forEach(photo => {
      const coords = parseCoords(photo.skica_coords)
      // Poređenje sa tolerancijom za floating point
      const coordForSketch = coords.find(c => Math.abs(c.sketchId - sketchId) < 0.001)
      if (coordForSketch) {
        markers.push({
          photoId: photo.id,
          photo: photo,
          x: coordForSketch.x,
          y: coordForSketch.y
        })
      }
    })
    return markers
  }

  // Klik na skicu - hvata koordinate
  const handleSketchClick = (e, sketchPhoto) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedPhotoForLink) {
      console.log('Nema izabrane fotografije za povezivanje')
      return
    }
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1)
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1)
    
    console.log('Klik na skicu:', { sketchId: sketchPhoto.id, x, y, selectedPhotoForLink })
    
    // Dodaj koordinate fotografiji
    const newCoord = `${sketchPhoto.id}:${x},${y}`
    const photo = photos.find(p => p.id === selectedPhotoForLink)
    
    if (photo) {
      let existingCoords = photo.skica_coords || ''
      // Ukloni stare koordinate za ovu skicu ako postoje
      const parts = existingCoords.split(';').filter(part => {
        const colonIndex = part.indexOf(':')
        if (colonIndex === -1) return false
        const partSketchId = parseFloat(part.substring(0, colonIndex))
        return Math.abs(partSketchId - sketchPhoto.id) >= 0.001
      })
      parts.push(newCoord)
      const newCoordsString = parts.filter(Boolean).join(';')
      
      console.log('Nove koordinate:', newCoordsString)
      
      const updatedPhotos = photos.map(p =>
        p.id === selectedPhotoForLink ? { ...p, skica_coords: newCoordsString } : p
      )
      onPhotosChange(updatedPhotos)
    }
    
    setSelectedPhotoForLink(null)
  }

  // Pronađi najbližu fotografiju na osnovu pozicije miša
  const findNearestPhoto = useCallback((mouseX, mouseY, markers) => {
    if (!markers || markers.length === 0) return null
    
    let nearest = null
    let minDistance = Infinity
    const threshold = 15 // 15% udaljenost - zona detekcije
    
    markers.forEach(marker => {
      const distance = Math.sqrt(
        Math.pow(mouseX - marker.x, 2) + Math.pow(mouseY - marker.y, 2)
      )
      if (distance < minDistance && distance < threshold) {
        minDistance = distance
        nearest = marker
      }
    })
    
    return nearest
  }, [])

  // Hover nad skicom - pronađi najbližu fotografiju
  const handleSketchMouseMove = useCallback((e, markers) => {
    if (selectedPhotoForLink) {
      setHoverPosition(null)
      return
    }
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width * 100)
    const y = ((e.clientY - rect.top) / rect.height * 100)
    
    const nearest = findNearestPhoto(x, y, markers)
    
    if (nearest) {
      setHoverPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        photo: nearest.photo
      })
    } else {
      setHoverPosition(null)
    }
  }, [selectedPhotoForLink, findNearestPhoto])

  // Skroluj do fotografije
  const scrollToPhoto = useCallback((photoId) => {
    const photoElement = photoRefs.current[photoId]
    if (photoElement) {
      photoElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Highlight efekat
      photoElement.classList.add('ring-4', 'ring-amber-400')
      setTimeout(() => {
        photoElement.classList.remove('ring-4', 'ring-amber-400')
      }, 2000)
    }
  }, [])

  // Ukloni marker sa skice
  const removeMarkerFromSketch = (photoId, sketchId) => {
    const photo = photos.find(p => p.id === photoId)
    if (!photo) return
    
    const parts = (photo.skica_coords || '').split(';').filter(part => {
      const match = part.match(/^(\d+):/)
      return match ? parseInt(match[1]) !== sketchId : false
    })
    
    const updatedPhotos = photos.map(p =>
      p.id === photoId ? { ...p, skica_coords: parts.join(';') } : p
    )
    onPhotosChange(updatedPhotos)
  }

  const handleFiles = (files) => {
    const fileArray = Array.from(files)
    const maxRedosled = photos.length > 0 ? Math.max(...photos.map(p => p.redosled || 0)) : 0
    const newPhotos = fileArray.map((file, index) => ({
      id: Date.now() + Math.random() + index,
      file,
      url: URL.createObjectURL(file),
      opis: '',
      redosled: maxRedosled + index + 1,
      glavna: photos.length === 0 && index === 0,
      stsskica: false,
      skica_coords: ''
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
      glavna: photo.id === id ? !photo.glavna : false
    }))
    onPhotosChange(updatedPhotos)
  }

  const toggleStsskica = (id) => {
    const updatedPhotos = photos.map(photo => 
      photo.id === id ? { ...photo, stsskica: !photo.stsskica } : photo
    )
    onPhotosChange(updatedPhotos)
    
    // Ako je ovo prva skica, postavi je kao aktivnu
    const photo = photos.find(p => p.id === id)
    if (photo && !photo.stsskica) {
      setActiveSketchId(id)
    }
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

  const updatePhotoCoords = (id, coords) => {
    const updatedPhotos = photos.map(photo =>
      photo.id === id ? { ...photo, skica_coords: coords } : photo
    )
    onPhotosChange(updatedPhotos)
  }

  // Postavi prvu skicu kao aktivnu ako nije postavljena
  if (sketchPhotos.length > 0 && !activeSketchId) {
    setActiveSketchId(sketchPhotos[0].id)
  }

  const activeSketch = sketchPhotos.find(s => s.id === activeSketchId)
  const markersForActiveSketch = activeSketch ? getMarkersForSketch(activeSketch.id) : []

  return (
    <div 
      className="space-y-4"
      data-photo-upload="true"
      onClick={(e) => {
        e.stopPropagation()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      {/* Upload zona */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-amber-500 bg-amber-50'
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
            e.stopPropagation()
          }}
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
          
          {/* Preview dugme */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowPreview(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Play className="w-5 h-5" />
              Preview galerije
            </button>
          </div>
          
          {/* Panel sa skicama - prikazuje se samo ako ima skica */}
          {sketchPhotos.length > 0 && (
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-900 to-black px-4 py-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-white" />
                  <h3 className="text-white font-semibold">Skice / Tlocrti</h3>
                  <span className="ml-auto text-xs text-gray-300">
                    {sketchPhotos.length} {sketchPhotos.length === 1 ? 'skica' : 'skica'}
                  </span>
                </div>
              </div>
              
              {/* Tabovi za izbor skice */}
              {sketchPhotos.length > 1 && (
                <div className="flex gap-2 p-3 border-b border-gray-100 overflow-x-auto">
                  {sketchPhotos.map((sketch, idx) => (
                    <button
                      key={sketch.id}
                      type="button"
                      onClick={() => setActiveSketchId(sketch.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        activeSketchId === sketch.id
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <img src={sketch.url} alt="" className="w-6 h-6 rounded object-cover" />
                      Skica {idx + 1}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Aktivna skica sa markerima */}
              {activeSketch && (
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {selectedPhotoForLink ? (
                        <span className="text-amber-600 font-medium animate-pulse">
                          👆 Sada kliknite na skicu gde želite da postavite marker
                        </span>
                      ) : (
                        <span>Prvo kliknite "Poveži sa skicom" kod fotografije ispod</span>
                      )}
                    </p>
                    {selectedPhotoForLink && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoForLink(null)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Otkaži
                      </button>
                    )}
                  </div>
                  
                  <div 
                    ref={sketchContainerRef}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPhotoForLink ? 'border-amber-400 cursor-crosshair' : 'border-gray-200 cursor-pointer'
                    }`}
                    onClick={(e) => handleSketchClick(e, activeSketch)}
                    onMouseMove={(e) => handleSketchMouseMove(e, markersForActiveSketch)}
                    onMouseLeave={() => setHoverPosition(null)}
                  >
                    <img 
                      src={activeSketch.url} 
                      alt="Skica" 
                      className="w-full h-auto"
                      draggable={false}
                    />
                    
                    {/* Markeri na skici */}
                    {markersForActiveSketch.map((marker, idx) => (
                      <div
                        key={marker.photoId}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
                        style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                        onMouseEnter={() => setHoveredMarker(marker.photoId)}
                        onMouseLeave={() => setHoveredMarker(null)}
                        onClick={(e) => {
                          e.stopPropagation()
                          scrollToPhoto(marker.photoId)
                        }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all cursor-pointer ${
                          hoveredMarker === marker.photoId ? 'bg-amber-500 scale-125' : 'bg-amber-600 hover:scale-110'
                        }`}>
                          {idx + 1}
                        </div>
                        
                        {/* Tooltip sa preview fotografije - prikazuje se na hover markera */}
                        {hoveredMarker === marker.photoId && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 w-40">
                              <img 
                                src={marker.photo.url} 
                                alt="" 
                                className="w-full h-24 object-cover rounded"
                              />
                              <p className="text-xs text-gray-600 mt-1 truncate text-center">
                                {marker.photo.opis || 'Bez opisa'}
                              </p>
                              <p className="text-xs text-amber-600 mt-1 text-center font-medium">
                                Klikni za skok na foto
                              </p>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Floating preview - prikazuje se kada si blizu markera */}
                    {hoverPosition && !selectedPhotoForLink && !hoveredMarker && (
                      <div 
                        className="absolute z-30 pointer-events-none transform -translate-x-1/2"
                        style={{ 
                          left: hoverPosition.x, 
                          top: Math.max(10, hoverPosition.y - 140)
                        }}
                      >
                        <div className="bg-white rounded-lg shadow-2xl border-2 border-amber-400 p-2 w-36 animate-fade-in">
                          <img 
                            src={hoverPosition.photo.url} 
                            alt="" 
                            className="w-full h-20 object-cover rounded"
                          />
                          <p className="text-xs text-gray-700 mt-1 truncate text-center font-medium">
                            {hoverPosition.photo.opis || 'Bez opisa'}
                          </p>
                          <p className="text-xs text-amber-600 text-center">
                            Približi se markeru
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-2">
                    {markersForActiveSketch.length} fotografija povezano sa ovom skicom
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Lista fotografija */}
          {photos
            .sort((a, b) => (a.redosled || 0) - (b.redosled || 0))
            .map((photo, index) => {
              const isSelectedForLink = selectedPhotoForLink === photo.id
              const photoCoords = parseCoords(photo.skica_coords)
              
              return (
                <div
                  key={photo.id}
                  ref={(el) => { photoRefs.current[photo.id] = el }}
                  className={`border rounded-xl p-4 bg-white shadow-sm transition-all scroll-mt-4 ${
                    isSelectedForLink 
                      ? 'border-amber-500 ring-2 ring-amber-200 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
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
                      {photo.stsskica && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full p-1">
                          <Layers className="w-4 h-4" />
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
                        
                        <label className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm border cursor-pointer transition-colors ${
                          photo.stsskica 
                            ? 'bg-blue-100 text-blue-700 border-blue-300' 
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}>
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
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Layers className="w-4 h-4" />
                          <span>Skica/Tlocrt</span>
                        </label>
                        
                        {/* Dugme za povezivanje sa skicom - samo za obične fotografije */}
                        {!photo.stsskica && sketchPhotos.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedPhotoForLink(isSelectedForLink ? null : photo.id)
                            }}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                              isSelectedForLink
                                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            <MapPin className={`w-4 h-4 ${isSelectedForLink ? 'animate-bounce' : ''}`} />
                            {isSelectedForLink ? '↑ Klikni na skicu gore' : 'Poveži sa skicom'}
                          </button>
                        )}
                        
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
                      
                      {/* Prikaz povezanih skica */}
                      {photoCoords.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500">Povezano sa:</span>
                          {photoCoords.map(coord => {
                            const sketch = sketchPhotos.find(s => s.id === coord.sketchId)
                            if (!sketch) return null
                            return (
                              <span 
                                key={coord.sketchId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs"
                              >
                                <img src={sketch.url} alt="" className="w-4 h-4 rounded object-cover" />
                                Skica ({coord.x}%, {coord.y}%)
                              </span>
                            )
                          })}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Opis:
                          </label>
                          <textarea
                            value={photo.opis || ''}
                            onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
                            placeholder="Unesite opis fotografije..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      {/* Koordinate - samo za obične fotografije */}
                      {!photo.stsskica && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Koordinate na skici:
                            <span className="font-normal text-gray-400 ml-1">(automatski ili ručno)</span>
                          </label>
                          <input
                            type="text"
                            value={photo.skica_coords || ''}
                            onChange={(e) => updatePhotoCoords(photo.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="npr. 123:45.5,67.2;456:12.3,89.1"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Format: skicaId:x%,y% (više koordinata razdvojeno sa ;)
                          </p>
                        </div>
                      )}
                      
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
                            e.target.value = ''
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Gallery Preview Modal */}
      {showPreview && (
        <GalleryPreview
          photos={photos}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
