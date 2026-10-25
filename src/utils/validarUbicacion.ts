import type { FeatureCollection, Geometry, Position } from 'geojson'

function pointOnSegment(
  latitude: number,
  longitude: number,
  start: Position,
  end: Position,
): boolean {
  const [startLongitude, startLatitude] = start
  const [endLongitude, endLatitude] = end
  const deltaLongitude = endLongitude - startLongitude
  const deltaLatitude = endLatitude - startLatitude
  const epsilon = 1e-10
  const cross =
    (longitude - startLongitude) * deltaLatitude
    - (latitude - startLatitude) * deltaLongitude

  return (
    Math.abs(cross) <= epsilon * Math.max(1, Math.abs(deltaLongitude), Math.abs(deltaLatitude))
    && longitude >= Math.min(startLongitude, endLongitude) - epsilon
    && longitude <= Math.max(startLongitude, endLongitude) + epsilon
    && latitude >= Math.min(startLatitude, endLatitude) - epsilon
    && latitude <= Math.max(startLatitude, endLatitude) + epsilon
  )
}

function pointInRing(latitude: number, longitude: number, ring: Position[]): boolean {
  let inside = false

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const start = ring[index]
    const end = ring[previous]
    const [startLongitude, startLatitude] = start
    const [endLongitude, endLatitude] = end

    if (pointOnSegment(latitude, longitude, start, end)) return true

    if (
      (startLatitude > latitude) !== (endLatitude > latitude)
      && longitude
        < ((endLongitude - startLongitude) * (latitude - startLatitude))
          / (endLatitude - startLatitude)
          + startLongitude
    ) {
      inside = !inside
    }
  }

  return inside
}

function pointInPolygon(latitude: number, longitude: number, rings: Position[][]): boolean {
  if (!rings.length || !pointInRing(latitude, longitude, rings[0])) return false
  return !rings.slice(1).some((ring) => pointInRing(latitude, longitude, ring))
}

function pointInGeometry(latitude: number, longitude: number, geometry: Geometry): boolean {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(latitude, longitude, geometry.coordinates)
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => pointInPolygon(latitude, longitude, polygon))
  }

  return false
}

export function validarUbicacionSJL(
  latitude: number,
  longitude: number,
  boundary: FeatureCollection,
): boolean {
  if (
    !Number.isFinite(latitude)
    || latitude < -90
    || latitude > 90
    || !Number.isFinite(longitude)
    || longitude < -180
    || longitude > 180
  ) {
    return false
  }

  return boundary.features.some((feature) =>
    feature.geometry !== null && pointInGeometry(latitude, longitude, feature.geometry)
  )
}
