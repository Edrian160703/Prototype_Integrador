import { useEffect, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import type { FeatureCollection } from 'geojson'
import L from 'leaflet'
import { validarUbicacionSJL } from '../utils/validarUbicacion'
import 'leaflet/dist/leaflet.css'

const centro: LatLngTuple = [-11.98, -77.01]

type Props = {
  onSeleccionar: (lat: number, lng: number) => void
}

type ResultadoBusqueda = {
  lat: string
  lon: string
  display_name: string
}

// Marcador verde visible
const iconoUbicacion = L.divIcon({
  className: 'marcador-negocio',
  html: `
    <div style="
      width:18px;
      height:18px;
      background:#16a34a;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Acerca el mapa a la ubicación encontrada
function MoverMapa({
  destino,
}: {
  destino: LatLngTuple | null
}) {
  const mapa = useMap()

  useEffect(() => {
    if (destino) {
      mapa.flyTo(destino, 16)
    }
  }, [destino, mapa])

  return null
}

// Permite seleccionar una ubicación haciendo clic
function MarcarUbicacion({
  ubicacion,
  onSeleccionarPunto,
}: {
  ubicacion: LatLngTuple | null
  onSeleccionarPunto: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(evento) {
      onSeleccionarPunto(
        evento.latlng.lat,
        evento.latlng.lng
      )
    },
  })

  return ubicacion ? (
    <Marker
      position={ubicacion}
      icon={iconoUbicacion}
    />
  ) : null
}

export default function MapaNegocio({
  onSeleccionar,
}: Props) {
  const [contorno, setContorno] =
    useState<FeatureCollection | null>(null)

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [direccion, setDireccion] = useState('')
  const [buscando, setBuscando] = useState(false)

  const [ubicacion, setUbicacion] =
    useState<LatLngTuple | null>(null)

  const [destinoMapa, setDestinoMapa] =
    useState<LatLngTuple | null>(null)

  // Evita consultas repetidas mientras se procesa una búsqueda
  const buscandoRef = useRef(false)
  const ultimaBusquedaRef = useRef(0)

  // Cargar los límites de San Juan de Lurigancho
  useEffect(() => {
    let activo = true

    fetch('/mapas/sjl.geojson')
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error('No se pudo cargar el mapa.')
        }

        return respuesta.json()
      })
      .then((datos: FeatureCollection) => {
        if (
          datos.type !== 'FeatureCollection' ||
          datos.features.length !== 1 ||
          !datos.features[0].geometry ||
          !['Polygon', 'MultiPolygon'].includes(
            datos.features[0].geometry.type
          ) ||
          datos.features[0].properties?.IDDIST !== '150132'
        ) {
          throw new Error(
            'El archivo no contiene los límites de SJL.'
          )
        }

        if (activo) {
          setContorno(datos)
        }
      })
      .catch(() => {
        if (activo) {
          setError(
            'No se pudieron cargar los límites de San Juan de Lurigancho.'
          )
        }
      })

    return () => {
      activo = false
    }
  }, [])

  // Validar y seleccionar la ubicación
  const seleccionarUbicacion = (
    lat: number,
    lng: number
  ): boolean => {
    if (
      !contorno ||
      !validarUbicacionSJL(lat, lng, contorno)
    ) {
      setMensaje(
        'Esta ubicación está fuera de San Juan de Lurigancho. Selecciona un punto dentro del contorno verde.'
      )
      return false
    }

    setUbicacion([lat, lng])
    setMensaje('')

    // Envía las coordenadas al formulario del comercio
    onSeleccionar(lat, lng)

    return true
  }

  // Buscar una dirección mediante OpenStreetMap
  const buscarDireccion = async () => {
    const texto = direccion.trim()

    if (!contorno) {
      setMensaje('Espera a que cargue el mapa.')
      return
    }

    if (texto.length < 3) {
      setMensaje(
        'Escribe una dirección o zona de al menos 3 caracteres.'
      )
      return
    }

    if (buscandoRef.current) return

    buscandoRef.current = true
    setBuscando(true)
    setMensaje('')

    try {
      // Evita realizar solicitudes demasiado seguidas
      const tiempoTranscurrido =
        Date.now() - ultimaBusquedaRef.current

      if (tiempoTranscurrido < 1100) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, 1100 - tiempoTranscurrido)
        )
      }

      ultimaBusquedaRef.current = Date.now()

      const parametros = new URLSearchParams({
        q: `${texto}, San Juan de Lurigancho, Lima, Perú`,
        format: 'jsonv2',
        limit: '5',
        countrycodes: 'pe',
        'accept-language': 'es',
      })

      const respuesta = await fetch(
        `https://nominatim.openstreetmap.org/search?${parametros.toString()}`
      )

      if (!respuesta.ok) {
        throw new Error('No se pudo buscar la dirección.')
      }

      const resultados =
        (await respuesta.json()) as ResultadoBusqueda[]

      // Solo aceptar resultados dentro de SJL
      const resultadoValido = resultados.find(
        (resultado) => {
          const lat = Number(resultado.lat)
          const lng = Number(resultado.lon)

          return (
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            validarUbicacionSJL(lat, lng, contorno)
          )
        }
      )

      if (!resultadoValido) {
        setMensaje(
          'No encontramos esa ubicación dentro de SJL. Intenta con otra dirección o selecciona el punto directamente en el mapa.'
        )
        return
      }

      const lat = Number(resultadoValido.lat)
      const lng = Number(resultadoValido.lon)

      if (seleccionarUbicacion(lat, lng)) {
        setDestinoMapa([lat, lng])
      }
    } catch {
      setMensaje(
        'No se pudo realizar la búsqueda. Puedes seleccionar la ubicación directamente en el mapa.'
      )
    } finally {
      buscandoRef.current = false
      setBuscando(false)
    }
  }

  return (
    <div
      style={{
        marginTop: '15px',
        marginBottom: '20px',
      }}
    >
      <p>
        Marca la ubicación de tu negocio dentro de
        San Juan de Lurigancho:
      </p>

      {/* Buscador de direcciones: no usa form */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <input
          type="text"
          value={direccion}
          onChange={(evento) =>
            setDireccion(evento.target.value)
          }
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') {
              evento.preventDefault()
              void buscarDireccion()
            }
          }}
          placeholder="Ej. Campoy, San Juan de Lurigancho"
          aria-label="Buscar dirección del negocio"
          style={{
            flex: 1,
            minWidth: 0,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '8px',
          }}
        />

        <button
          type="button"
          onClick={() => void buscarDireccion()}
          disabled={buscando || !contorno}
          style={{
            padding: '10px 15px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: buscando ? 'wait' : 'pointer',
          }}
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Mensajes de error */}
      {error && (
        <p role="alert" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}

      {!contorno && !error && (
        <p>Cargando límites del distrito...</p>
      )}

      {/* Mapa interactivo */}
      {contorno && (
        <MapContainer
          center={centro}
          zoom={13}
          minZoom={11}
          maxBounds={L.geoJSON(contorno)
            .getBounds()
            .pad(0.1)}
          maxBoundsViscosity={1}
          style={{
            height: '320px',
            width: '100%',
            borderRadius: '10px',
          }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors, HOT"
            url="https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          />

          {/* Contorno verde de SJL */}
          <GeoJSON
            data={contorno}
            style={{
              color: '#16a34a',
              weight: 3,
              fillColor: '#22c55e',
              fillOpacity: 0.08,
            }}
          />

          {/* Marcador de ubicación */}
          <MarcarUbicacion
            ubicacion={ubicacion}
            onSeleccionarPunto={seleccionarUbicacion}
          />

          {/* Movimiento automático del mapa */}
          <MoverMapa destino={destinoMapa} />
        </MapContainer>
      )}

      {/* Coordenadas seleccionadas */}
      {ubicacion && (
        <p
          style={{
            marginTop: '10px',
            color: '#166534',
            fontWeight: 500,
          }}
        >
          📍 Ubicación seleccionada:{' '}
          {ubicacion[0].toFixed(6)},{' '}
          {ubicacion[1].toFixed(6)}
        </p>
      )}

      {mensaje && (
        <p
          role="alert"
          style={{
            color: '#b91c1c',
            marginTop: '10px',
          }}
        >
          {mensaje}
        </p>
      )}

      <small>
        Búsqueda de direcciones mediante OpenStreetMap.
        Confirma el punto exacto en el mapa.
      </small>
    </div>
  )
}