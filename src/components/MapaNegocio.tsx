
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, GeoJSON, useMapEvents } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import type { FeatureCollection } from 'geojson'
import L from 'leaflet'
import { validarUbicacionSJL } from '../utils/validarUbicacion'
import 'leaflet/dist/leaflet.css'

const centro: LatLngTuple = [-11.98, -77.01]

type Props = {
  onSeleccionar: (lat: number, lng: number) => void
}

function MarcarUbicacion({
  onSeleccionar,
  contorno,
}: Props & { contorno: FeatureCollection }) {
  const [ubicacion, setUbicacion] = useState<LatLngTuple | null>(null)
  const [mensaje, setMensaje] = useState('')

  useMapEvents({
    click(e) {
      const lat = e.latlng.lat
      const lng = e.latlng.lng

      if (!validarUbicacionSJL(lat, lng, contorno)) {
        setMensaje('Esta ubicación está fuera de San Juan de Lurigancho.')
        return
      }

      setUbicacion([lat, lng])
      setMensaje('')
      onSeleccionar(lat, lng)
    },
  })

  return (
    <>
      {ubicacion && <Marker position={ubicacion} />}
      {mensaje && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            zIndex: 1000,
            background: 'white',
            color: '#b91c1c',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px #0002',
          }}
        >
          {mensaje}
        </div>
      )}
    </>
  )
}

export default function MapaNegocio({ onSeleccionar }: Props) {
  const [contorno, setContorno] = useState<FeatureCollection | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/mapas/sjl.geojson')
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error('No se pudo cargar el mapa de SJL.')
        }
        return respuesta.json()
      })
      .then((datos: FeatureCollection) => {
        if (
          datos.type !== 'FeatureCollection' ||
          datos.features.length !== 1 ||
          !datos.features[0].geometry ||
          !['Polygon', 'MultiPolygon'].includes(datos.features[0].geometry.type) ||
          datos.features[0].properties?.IDDIST !== '150132'
        ) {
          throw new Error('El archivo no contiene el distrito esperado.')
        }

        setContorno(datos)
      })
      .catch(() => {
        setError('No se pudieron cargar los límites de SJL.')
      })
  }, [])

  return (
    <div style={{ marginTop: '15px', marginBottom: '20px' }}>
      <p>Marca la ubicación de tu negocio dentro de San Juan de Lurigancho:</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!contorno && !error && <p>Cargando límites del distrito...</p>}

      {contorno && (
        <MapContainer
          center={centro}
          zoom={13}
          minZoom={11}
          maxBounds={L.geoJSON(contorno).getBounds().pad(0.1)}
          maxBoundsViscosity={1}
          style={{ height: '320px', width: '100%', borderRadius: '10px' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors, HOT'
            url="https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />

          <GeoJSON
            data={contorno}
            style={{
              color: '#16a34a',
              weight: 3,
              fillColor: '#22c55e',
              fillOpacity: 0.08,
            }}
          />

          <MarcarUbicacion
            contorno={contorno}
            onSeleccionar={onSeleccionar}
          />
        </MapContainer>
      )}
    </div>
  )
}
