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
  console.log('🗺️ PropertyMap render, address:', address)
  
  const [position, setPosition] = useState(null) // { lat: number, lng: number } | null
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState('')
  const [userSelectedPosition, setUserSelectedPosition] = useState(false) // Flag da li je korisnik ručno izabrao poziciju

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

    const result = parts.join(', ')
    console.log('🗺️ PropertyMap query:', result)
    return result
  }, [address?.drzava, address?.grad, address?.opstina, address?.ulica, address?.broj])

  // Default centar (Beograd) — mapa uvek treba da se vidi i bez rezultata
  const defaultCenter = useMemo(() => ({ lat: 44.7866, lng: 20.4489 }), [])

  useEffect(() => {
    // Ako je korisnik ručno izabrao poziciju, ne geokodiraj ponovo
    if (userSelectedPosition) {
      console.log('🗺️ PropertyMap: Korisnik je ručno izabrao poziciju, preskačem geokodiranje')
      return
    }

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
        console.log('🗺️ PropertyMap: Počinjem geokodiranje za query:', query)

        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
        console.log('🗺️ PropertyMap: Nominatim URL:', url)
        
        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        console.log('🗺️ PropertyMap: Nominatim response status:', res.status, res.ok)

        if (!res.ok) {
          throw new Error(`Nominatim greška: ${res.status}`)
        }

        const data = await res.json()
        console.log('🗺️ PropertyMap: Nominatim response data:', data)
        
        const first = Array.isArray(data) && data.length > 0 ? data[0] : null
        console.log('🗺️ PropertyMap: Prvi rezultat:', first)

        if (first?.lat && first?.lon) {
          const next = { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
          console.log('🗺️ PropertyMap: Parsirane koordinate:', next)
          
          if (!Number.isNaN(next.lat) && !Number.isNaN(next.lng)) {
            setPosition(next)
            console.log('🗺️ PropertyMap: Postavljam position:', next)
            if (typeof onLocationChange === 'function') {
              console.log('🗺️ PropertyMap: Pozivam onLocationChange:', next)
              onLocationChange(next)
            } else {
              console.warn('🗺️ PropertyMap: onLocationChange nije funkcija!')
            }
          } else {
            console.warn('🗺️ PropertyMap: Koordinate su NaN!', next)
          }
        } else {
          // Ako nema rezultata, ne brišemo poslednju validnu lokaciju (marker ostaje gde je bio)
          console.warn('🗺️ PropertyMap: Nije pronađena lokacija za query:', query)
          setError('Nije pronađena lokacija za unetu adresu.')
        }
      } catch (e) {
        if (e?.name === 'AbortError') {
          console.log('🗺️ PropertyMap: Request abort-ovan')
          return
        }
        console.error('🗺️ PropertyMap: Greška pri geokodiranju:', e)
        setError(e?.message || 'Greška pri geokodiranju')
      } finally {
        setIsGeocoding(false)
        console.log('🗺️ PropertyMap: Geokodiranje završeno')
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
  }, [query, onLocationChange, userSelectedPosition])

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        const next = { lat: e.latlng.lat, lng: e.latlng.lng }
        console.log('🗺️ PropertyMap: Klik na mapu:', next)
        setUserSelectedPosition(true) // Označi da je korisnik ručno izabrao poziciju
        setPosition(next)
        setError('') // Očisti greške
        if (typeof onLocationChange === 'function') {
          console.log('🗺️ PropertyMap: Pozivam onLocationChange sa klikom:', next)
          onLocationChange(next)
        } else {
          console.warn('🗺️ PropertyMap: onLocationChange nije funkcija pri kliku!')
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

  const mapCenter = [position?.lat ?? defaultCenter.lat, position?.lng ?? defaultCenter.lng]
  const mapZoom = position ? 15 : 12
  
  console.log('🗺️ PropertyMap: Render sa center:', mapCenter, 'zoom:', mapZoom, 'position:', position)

  return (
    <div className="w-full">
      <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
        <MapContainer
          key={`map-${mapCenter[0]}-${mapCenter[1]}`}
          center={mapCenter}
          zoom={mapZoom}
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

