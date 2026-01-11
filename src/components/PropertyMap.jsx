import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet default ikonice (Vite bundling fix)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix za prikaz markera (bez ovoga marker često bude "prazan" u bundlerima)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

/**
 * PropertyMap
 *
 * Props:
 * - address: { drzava, grad, opstina, ulica, broj }
 *   Sve vrednosti su string ili prazno/undefined/null. Komponenta spaja adresu u upit za geokodiranje.
 * - onLocationChange: ({ lat, lng }) => void
 *   Poziva se kada se dobije lokacija iz Nominatim-a ili kada korisnik klikne na mapu.
 */
export default function PropertyMap({ address, onLocationChange }) {
  const [position, setPosition] = useState(null) // { lat: number, lng: number } | null
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState('')

  const abortRef = useRef(null)
  const debounceRef = useRef(null)

  const query = useMemo(() => {
    const parts = [
      address?.ulica,
      address?.broj,
      address?.opstina,
      address?.grad,
      address?.drzava,
    ]
      .map(v => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean)

    return parts.join(', ')
  }, [address?.drzava, address?.grad, address?.opstina, address?.ulica, address?.broj])

  // Default centar (Beograd) — mapa uvek treba da se vidi i bez rezultata
  const defaultCenter = useMemo(() => ({ lat: 44.7866, lng: 20.4489 }), [])

  useEffect(() => {
    // Očisti prethodni debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    // Prekini prethodni request
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    // Ako nema smislenog upita, ne geokodiraj
    if (!query || query.length < 3) {
      setError('')
      setIsGeocoding(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller

      try {
        setIsGeocoding(true)
        setError('')

        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!res.ok) {
          throw new Error(`Nominatim greška: ${res.status}`)
        }

        const data = await res.json()
        const first = Array.isArray(data) && data.length > 0 ? data[0] : null

        if (first?.lat && first?.lon) {
          const next = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
          if (!Number.isNaN(next.lat) && !Number.isNaN(next.lng)) {
            setPosition(next)
            if (typeof onLocationChange === 'function') {
              onLocationChange(next)
            }
          }
        } else {
          // Ako nema rezultata, ne brišemo poslednju validnu lokaciju (marker ostaje gde je bio)
          setError('Nije pronađena lokacija za unetu adresu.')
        }
      } catch (e) {
        if (e?.name === 'AbortError') return
        console.error('Greška pri geokodiranju:', e)
        setError(e?.message || 'Greška pri geokodiranju')
      } finally {
        setIsGeocoding(false)
      }
    }, 750)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
    }
  }, [query, onLocationChange])

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        const next = { lat: e.latlng.lat, lng: e.latlng.lng }
        setPosition(next)
        if (typeof onLocationChange === 'function') {
          onLocationChange(next)
        }
      },
    })
    return null
  }

  function RecenterOnPosition({ pos }) {
    const map = useMap()
    useEffect(() => {
      if (pos?.lat && pos?.lng) {
        map.setView([pos.lat, pos.lng], Math.max(map.getZoom(), 15), { animate: true })
      }
    }, [map, pos?.lat, pos?.lng])
    return null
  }

  return (
    <div className="w-full">
      <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
        <MapContainer
          center={[position?.lat ?? defaultCenter.lat, position?.lng ?? defaultCenter.lng]}
          zoom={position ? 15 : 12}
          scrollWheelZoom
          style={{ height: 360, width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler />
          <RecenterOnPosition pos={position} />

          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {query && (
          <div className="text-xs text-gray-600">
            Adresa: <span className="font-medium">{query}</span>
            {isGeocoding && <span className="ml-2 text-gray-500">(tražim lokaciju...)</span>}
          </div>
        )}
        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>
    </div>
  )
}

