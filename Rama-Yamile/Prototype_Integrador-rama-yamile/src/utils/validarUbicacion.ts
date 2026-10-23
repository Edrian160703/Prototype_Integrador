
import type { FeatureCollection, Geometry, Position } from 'geojson'

type Punto = Position

function puntoEnAnillo(lat: number, lng: number, anillo: Punto[]): boolean {
  let dentro = false

  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i]
    const [xj, yj] = anillo[j]

    if (
      (yi > lat) !== (yj > lat) &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      dentro = !dentro
    }
  }

  return dentro
}

function puntoEnPoligono(
  lat: number,
  lng: number,
  anillos: Punto[][]
): boolean {
  if (!anillos.length || !puntoEnAnillo(lat, lng, anillos[0])) {
    return false
  }

  return !anillos.slice(1).some((anillo) => puntoEnAnillo(lat, lng, anillo))
}

function puntoEnGeometria(lat: number, lng: number, geometria: Geometry): boolean {
  if (geometria.type === 'Polygon') {
    return puntoEnPoligono(lat, lng, geometria.coordinates)
  }

  if (geometria.type === 'MultiPolygon') {
    return geometria.coordinates.some((poligono) =>
      puntoEnPoligono(lat, lng, poligono)
    )
  }

  return false
}

export function validarUbicacionSJL(
  lat: number,
  lng: number,
  contorno: FeatureCollection
): boolean {
  return contorno.features.some((feature) =>
    feature.geometry !== null &&
    puntoEnGeometria(lat, lng, feature.geometry)
  )
}
