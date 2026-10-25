import { useEffect, useState } from 'react'
import { GeoJSON, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import type { FeatureCollection } from 'geojson'
import L from 'leaflet'
import type { BusinessCoordinates } from '../types/user'
import { validarUbicacionSJL } from '../utils/validarUbicacion'
import 'leaflet/dist/leaflet.css'

interface MapaNegocioProps {
  selectedLocation: BusinessCoordinates | null
  onSelect: (location: BusinessCoordinates | null) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSjlBoundary(value: unknown): value is FeatureCollection {
  if (!isRecord(value) || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
    return false
  }
  if (value.features.length !== 1) return false

  const feature = value.features[0]
  if (!isRecord(feature) || !isRecord(feature.properties) || feature.properties.IDDIST !== '150132') {
    return false
  }
  if (!isRecord(feature.geometry)) return false

  return (
    (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
    && Array.isArray(feature.geometry.coordinates)
  )
}

const markerIcon = L.divIcon({
  className: 'business-location-marker',
  html: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function LocationSelection({
  boundary,
  selectedLocation,
  onSelect,
}: MapaNegocioProps & { boundary: FeatureCollection }) {
  const [message, setMessage] = useState('')

  useMapEvents({
    click(event) {
      const location = {
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      }

      if (!validarUbicacionSJL(location.latitude, location.longitude, boundary)) {
        setMessage('Esta ubicación está fuera de San Juan de Lurigancho. Elige un punto dentro del contorno verde.')
        return
      }

      setMessage('')
      onSelect(location)
    },
  })

  const hasValidLocation = selectedLocation !== null
    && validarUbicacionSJL(selectedLocation.latitude, selectedLocation.longitude, boundary)

  return (
    <>
      {hasValidLocation && selectedLocation && (
        <Marker
          position={[selectedLocation.latitude, selectedLocation.longitude]}
          icon={markerIcon}
        />
      )}
      {message && <div className="business-map-message" role="alert">{message}</div>}
    </>
  )
}

export default function MapaNegocio({ selectedLocation, onSelect }: MapaNegocioProps) {
  const [boundary, setBoundary] = useState<FeatureCollection | null>(null)
  const [error, setError] = useState('')
  const [invalidSavedLocation, setInvalidSavedLocation] = useState(false)

  useEffect(() => {
    let active = true

    const loadBoundary = async () => {
      try {
        const response = await fetch('/mapas/sjl.geojson')
        if (!response.ok) throw new Error('La respuesta del GeoJSON no fue correcta.')
        const data: unknown = await response.json()
        if (!isSjlBoundary(data)) throw new Error('El GeoJSON no contiene los límites esperados de SJL.')
        if (active) setBoundary(data)
      } catch {
        if (active) setError('No se pudieron cargar los límites oficiales de SJL. Inténtalo nuevamente más tarde.')
      }
    }

    void loadBoundary()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="business-map">
      <p>Marca la ubicación de tu negocio dentro de San Juan de Lurigancho:</p>
      {error && <p className="field-error" role="alert">{error}</p>}
      {!boundary && !error && <p role="status">Cargando límites del distrito...</p>}
      {boundary && (
        <MapContainer
          center={L.geoJSON(boundary).getBounds().getCenter()}
          zoom={12}
          minZoom={11}
          maxBounds={L.geoJSON(boundary).getBounds().pad(0.1)}
          maxBoundsViscosity={1}
          className="business-map-canvas"
          whenReady={() => {
            if (
              selectedLocation
              && !validarUbicacionSJL(selectedLocation.latitude, selectedLocation.longitude, boundary)
            ) {
              setInvalidSavedLocation(true)
              onSelect(null)
            }
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors, HOT'
            url="https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />
          <GeoJSON
            data={boundary}
            style={{
              color: '#16a34a',
              weight: 3,
              fillColor: '#22c55e',
              fillOpacity: 0.08,
            }}
          />
          <LocationSelection
            boundary={boundary}
            selectedLocation={selectedLocation}
            onSelect={onSelect}
          />
          {invalidSavedLocation && (
            <div className="business-map-message" role="alert">
              La ubicación guardada está fuera de los límites de San Juan de Lurigancho. Selecciona otro punto.
            </div>
          )}
        </MapContainer>
      )}
    </div>
  )
}
