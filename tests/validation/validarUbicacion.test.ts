import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { FeatureCollection } from 'geojson'
import { validarUbicacionSJL } from '../../src/utils/validarUbicacion'

const polygon: FeatureCollection = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]],
        [[-0.25, -0.25], [0.25, -0.25], [0.25, 0.25], [-0.25, 0.25], [-0.25, -0.25]],
      ],
    },
  }],
}

describe('validarUbicacionSJL', () => {
  it('acepta un punto dentro del área', () => {
    expect(validarUbicacionSJL(0.75, 0.75, polygon)).toBe(true)
  })

  it('rechaza puntos fuera del área y dentro de un agujero', () => {
    expect(validarUbicacionSJL(0, 2, polygon)).toBe(false)
    expect(validarUbicacionSJL(0, 0, polygon)).toBe(false)
  })

  it('acepta puntos en el límite exterior del polígono', () => {
    expect(validarUbicacionSJL(-1, 0, polygon)).toBe(true)
    expect(validarUbicacionSJL(1, 1, polygon)).toBe(true)
  })

  it('rechaza coordenadas incompletas o fuera de rango', () => {
    expect(validarUbicacionSJL(Number.NaN, 0, polygon)).toBe(false)
    expect(validarUbicacionSJL(91, 0, polygon)).toBe(false)
    expect(validarUbicacionSJL(0, Number.POSITIVE_INFINITY, polygon)).toBe(false)
  })

  it('carga y valida el GeoJSON original del distrito de SJL', () => {
    const source = readFileSync('public/mapas/sjl.geojson', 'utf8')
    const boundary = JSON.parse(source) as FeatureCollection
    const feature = boundary.features[0]
    const geometry = feature.geometry

    expect(boundary.type).toBe('FeatureCollection')
    expect(boundary.features).toHaveLength(1)
    expect(feature.properties?.IDDIST).toBe('150132')
    expect(geometry?.type).toBe('Polygon')

    if (!geometry || geometry.type !== 'Polygon') {
      throw new Error('El GeoJSON de SJL no contiene un polígono.')
    }
    const [longitude, latitude] = geometry.coordinates[0][0]
    expect(validarUbicacionSJL(latitude, longitude, boundary)).toBe(true)
    expect(validarUbicacionSJL(-12.03, -77.021, boundary)).toBe(true)
    expect(validarUbicacionSJL(0, 0, boundary)).toBe(false)
  })
})
