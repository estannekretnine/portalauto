import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Layers, Image as ImageIcon, ZoomIn, Maximize2 } from 'lucide-react'

/**
 * GalleryPreview - Interaktivni prikaz galerije sa skicama
 * 
 * Funkcionalnosti:
 * - Skice sa strane, galerija fotografija u centru
 * - Hover na skici prikazuje povezanu fotografiju
 * - Scroll galerije highlightuje marker na skici
 * - Podrška za više fotografija po markeru
 * - Lightbox za uvećani prikaz
 */
export default function GalleryPreview({ photos = [], onClose }) {
  const [activeSketchId, setActiveSketchId] = useState(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [highlightedMarker, setHighlightedMarker] = useState(null)
  const galleryRef = useRef(null)
  const photoRefs = useRef({})

  // Razdvoji skice i obične fotografije
  const sketches = useMemo(() => {
    return photos.filter(p => p.stsskica).sort((a, b) => (a.redosled || 0) - (b.redosled || 0))
  }, [photos])

  const regularPhotos = useMemo(() => {
    return photos.filter(p => !p.stsskica).sort((a, b) => (a.redosled || 0) - (b.redosled || 0))
  }, [photos])

  // Postavi prvu skicu kao aktivnu
  useEffect(() => {
    if (sketches.length > 0 && !activeSketchId) {
      setActiveSketchId(sketches[0].id)
    }
  }, [sketches, activeSketchId])

  // Parsiranje koordinata - format: "sketchId:x,y;sketchId2:x2,y2"
  const parseCoords = useCallback((coordsString) => {
    if (!coordsString) return []
    const coords = []
    const parts = coordsString.split(';').filter(Boolean)
    parts.forEach(part => {
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
  }, [])

  // Grupiši fotografije po markeru (poziciji na skici)
  // Vraća mapu: "x,y" -> [photo1, photo2, ...]
  const getMarkersForSketch = useCallback((sketchId) => {
    const markersMap = new Map() // key: "x,y", value: { x, y, photos: [] }
    
    regularPhotos.forEach(photo => {
      const coords = parseCoords(photo.skica_coords)
      const coordForSketch = coords.find(c => Math.abs(c.sketchId - sketchId) < 0.001)
      
      if (coordForSketch) {
        const key = `${coordForSketch.x.toFixed(1)},${coordForSketch.y.toFixed(1)}`
        
        if (!markersMap.has(key)) {
          markersMap.set(key, {
            x: coordForSketch.x,
            y: coordForSketch.y,
            photos: []
          })
        }
        markersMap.get(key).photos.push(photo)
      }
    })
    
    return Array.from(markersMap.values())
  }, [regularPhotos, parseCoords])

  const activeSketch = sketches.find(s => s.id === activeSketchId)
  const markersForActiveSketch = activeSketch ? getMarkersForSketch(activeSketch.id) : []

  // Pronađi marker za trenutnu fotografiju
  const findMarkerForPhoto = useCallback((photoId) => {
    if (!activeSketch) return null
    
    const photo = regularPhotos.find(p => p.id === photoId)
    if (!photo) return null
    
    const coords = parseCoords(photo.skica_coords)
    const coordForSketch = coords.find(c => Math.abs(c.sketchId - activeSketch.id) < 0.001)
    
    if (coordForSketch) {
      return `${coordForSketch.x.toFixed(1)},${coordForSketch.y.toFixed(1)}`
    }
    return null
  }, [activeSketch, regularPhotos, parseCoords])

  // Kada se promeni trenutna fotografija, highlightuj njen marker
  useEffect(() => {
    if (regularPhotos[currentPhotoIndex]) {
      const markerKey = findMarkerForPhoto(regularPhotos[currentPhotoIndex].id)
      setHighlightedMarker(markerKey)
    }
  }, [currentPhotoIndex, regularPhotos, findMarkerForPhoto])

  // Navigacija galerije
  const goToPhoto = (index) => {
    setCurrentPhotoIndex(index)
    // Skroluj do fotografije u thumbnail traci
    const photoEl = photoRefs.current[regularPhotos[index]?.id]
    if (photoEl) {
      photoEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  const nextPhoto = () => {
    goToPhoto((currentPhotoIndex + 1) % regularPhotos.length)
  }

  const prevPhoto = () => {
    goToPhoto((currentPhotoIndex - 1 + regularPhotos.length) % regularPhotos.length)
  }

  // Keyboard navigacija
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxPhoto) {
          setLightboxPhoto(null)
        } else {
          onClose()
        }
      } else if (e.key === 'ArrowRight') {
        nextPhoto()
      } else if (e.key === 'ArrowLeft') {
        prevPhoto()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxPhoto, currentPhotoIndex])

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="text-white text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Nema fotografija za prikaz</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">
            Zatvori
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b border-white/10">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Preview galerije
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">
            {currentPhotoIndex + 1} / {regularPhotos.length} fotografija
          </span>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Leva strana - Skice */}
        {sketches.length > 0 && (
          <div className="w-80 bg-gray-900 border-r border-white/10 flex flex-col">
            {/* Tabovi za skice */}
            {sketches.length > 1 && (
              <div className="flex gap-1 p-2 border-b border-white/10 overflow-x-auto">
                {sketches.map((sketch, idx) => (
                  <button
                    key={sketch.id}
                    onClick={() => setActiveSketchId(sketch.id)}
                    className={`px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${
                      activeSketchId === sketch.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    Skica {idx + 1}
                  </button>
                ))}
              </div>
            )}
            
            {/* Aktivna skica sa markerima */}
            {activeSketch && (
              <div className="flex-1 p-3 overflow-auto">
                <div className="relative rounded-lg overflow-hidden bg-white">
                  <img
                    src={activeSketch.url}
                    alt="Skica"
                    className="w-full h-auto"
                    draggable={false}
                  />
                  
                  {/* Markeri */}
                  {markersForActiveSketch.map((marker, idx) => {
                    const markerKey = `${marker.x.toFixed(1)},${marker.y.toFixed(1)}`
                    const isHighlighted = highlightedMarker === markerKey
                    const isHovered = hoveredMarkerId === markerKey
                    const hasMultiplePhotos = marker.photos.length > 1
                    
                    return (
                      <div
                        key={markerKey}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                        style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                        onMouseEnter={() => {
                          setHoveredMarkerId(markerKey)
                          // Automatski prikaži fotografiju na hover
                          if (marker.photos.length > 0) {
                            const photoIndex = regularPhotos.findIndex(p => p.id === marker.photos[0].id)
                            if (photoIndex !== -1) {
                              goToPhoto(photoIndex)
                            }
                          }
                        }}
                        onMouseLeave={() => setHoveredMarkerId(null)}
                      >
                        {/* Pulsiranje za aktivni marker */}
                        {(isHighlighted || isHovered) && (
                          <div className="absolute inset-0 w-12 h-12 -m-2 rounded-full bg-amber-400 animate-ping opacity-40"></div>
                        )}
                        
                        {/* Marker krug */}
                        <div 
                          className={`
                            relative flex items-center justify-center text-white font-bold 
                            cursor-pointer transition-all shadow-lg
                            ${(isHighlighted || isHovered) 
                              ? 'w-12 h-12 text-base bg-gradient-to-br from-amber-400 to-orange-500 scale-110 ring-4 ring-white shadow-2xl shadow-amber-500/50' 
                              : 'w-8 h-8 text-xs bg-amber-600 hover:scale-105'}
                            rounded-full
                          `}
                        >
                          {hasMultiplePhotos ? (
                            <span className={isHighlighted || isHovered ? 'text-sm' : 'text-[10px]'}>{marker.photos.length}</span>
                          ) : (
                            idx + 1
                          )}
                        </div>
                        
                        {/* Badge za više fotografija */}
                        {hasMultiplePhotos && !(isHighlighted || isHovered) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                            +
                          </div>
                        )}
                        
                        {/* Mini tooltip - samo opis */}
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                            <div className="bg-gray-900/95 backdrop-blur rounded-lg shadow-xl border border-amber-500/30 px-3 py-2 whitespace-nowrap">
                              <p className="text-sm text-white font-medium">
                                {marker.photos[0]?.opis || `Fotografija ${idx + 1}`}
                              </p>
                              {hasMultiplePhotos && (
                                <p className="text-xs text-amber-400 mt-0.5">
                                  + još {marker.photos.length - 1} foto
                                </p>
                              )}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-gray-900/95"></div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                <p className="text-xs text-white/40 mt-2 text-center">
                  {markersForActiveSketch.length} lokacija označeno
                </p>
              </div>
            )}
          </div>
        )}

        {/* Desna strana - Glavna fotografija */}
        <div className="flex-1 flex flex-col">
          {/* Glavna fotografija */}
          <div className="flex-1 flex items-center justify-center p-4 relative">
            {regularPhotos.length > 0 ? (
              <>
                {/* Navigacija levo */}
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                {/* Fotografija */}
                <div className="relative max-w-full max-h-full">
                  <img
                    src={regularPhotos[currentPhotoIndex]?.url}
                    alt={regularPhotos[currentPhotoIndex]?.opis || 'Fotografija'}
                    className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-2xl"
                  />
                  
                  {/* Dugme za zoom */}
                  <button
                    onClick={() => setLightboxPhoto(regularPhotos[currentPhotoIndex])}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                  
                  {/* Opis fotografije */}
                  {regularPhotos[currentPhotoIndex]?.opis && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                      <p className="text-white text-center">
                        {regularPhotos[currentPhotoIndex].opis}
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigacija desno */}
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            ) : (
              <div className="text-white/50 text-center">
                <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                <p>Samo skice, nema fotografija</p>
              </div>
            )}
          </div>

          {/* Thumbnail traka */}
          {regularPhotos.length > 1 && (
            <div 
              ref={galleryRef}
              className="h-24 bg-black/50 border-t border-white/10 flex gap-2 p-2 overflow-x-auto"
            >
              {regularPhotos.map((photo, index) => {
                const markerKey = findMarkerForPhoto(photo.id)
                const hasMarker = markerKey !== null
                
                return (
                  <button
                    key={photo.id}
                    ref={(el) => { photoRefs.current[photo.id] = el }}
                    onClick={() => goToPhoto(index)}
                    className={`
                      flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden relative transition-all
                      ${currentPhotoIndex === index 
                        ? 'ring-2 ring-amber-500 scale-105' 
                        : 'opacity-60 hover:opacity-100'}
                    `}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {hasMarker && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                        <Layers className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-60"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxPhoto.url}
            alt={lightboxPhoto.opis || ''}
            className="max-w-[95vw] max-h-[95vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
