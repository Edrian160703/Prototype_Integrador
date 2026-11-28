import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import MapaNegocio from '../../src/components/MapaNegocio'

const mapMocks = vi.hoisted(() => ({
  clickHandler: undefined as undefined | ((event: { latlng: { lat: number; lng: number } }) => void),
  flyTo: vi.fn(),
}))

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
    geoJSON: vi.fn(() => ({
      getBounds: () => ({
        getCenter: () => [0, 0],
        pad: () => ({}),
      }),
    })),
  },
}))

vi.mock('react-leaflet', () => ({
  GeoJSON: () => null,
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Marker: ({ position }: { position: [number, number] }) => (
    <span data-testid="business-marker">{position.join(',')}</span>
  ),
  TileLayer: () => null,
  useMap: () => ({ flyTo: mapMocks.flyTo }),
  useMapEvents: (handlers: {
    click: (event: { latlng: { lat: number; lng: number } }) => void
  }) => {
    mapMocks.clickHandler = handlers.click
  },
}))

const boundary = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { IDDIST: '150132' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]],
    },
  }],
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  mapMocks.clickHandler = undefined
  mapMocks.flyTo.mockClear()
})

function mockGeoJsonFetch() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => boundary,
  }))
}

describe('MapaNegocio', () => {
  it('carga el límite y actualiza el marcador al seleccionar nuevos puntos', async () => {
    mockGeoJsonFetch()
    const onSeleccionar = vi.fn()
    render(<MapaNegocio onSeleccionar={onSeleccionar} />)

    await waitFor(() => expect(mapMocks.clickHandler).toBeDefined())
    expect(fetch).toHaveBeenCalledWith('/mapas/sjl.geojson')

    act(() => mapMocks.clickHandler?.({ latlng: { lat: 0.5, lng: 0.5 } }))
    expect((await screen.findByTestId('business-marker')).textContent).toBe('0.5,0.5')
    expect(onSeleccionar).toHaveBeenLastCalledWith(0.5, 0.5)

    act(() => mapMocks.clickHandler?.({ latlng: { lat: -0.5, lng: -0.5 } }))
    await waitFor(() => expect(screen.getByTestId('business-marker').textContent).toBe('-0.5,-0.5'))
    expect(onSeleccionar).toHaveBeenLastCalledWith(-0.5, -0.5)
  })

  it('muestra en el marcador una ubicación válida y envía sus coordenadas', async () => {
    mockGeoJsonFetch()
    const onSeleccionar = vi.fn()
    render(<MapaNegocio onSeleccionar={onSeleccionar} />)

    await waitFor(() => expect(mapMocks.clickHandler).toBeDefined())
    act(() => mapMocks.clickHandler?.({ latlng: { lat: 0.25, lng: -0.25 } }))

    expect((await screen.findByTestId('business-marker')).textContent).toBe('0.25,-0.25')
    expect(onSeleccionar).toHaveBeenCalledWith(0.25, -0.25)
  })

  it('muestra un mensaje y no cambia la ubicación al hacer clic fuera del límite', async () => {
    mockGeoJsonFetch()
    const onSeleccionar = vi.fn()
    render(<MapaNegocio onSeleccionar={onSeleccionar} />)

    await waitFor(() => expect(mapMocks.clickHandler).toBeDefined())
    act(() => mapMocks.clickHandler?.({ latlng: { lat: 0, lng: 2 } }))

    expect(screen.getByRole('alert').textContent).toContain('fuera de San Juan de Lurigancho')
    expect(onSeleccionar).not.toHaveBeenCalled()
  })

  it('muestra error si no se carga el GeoJSON oficial', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    render(<MapaNegocio onSeleccionar={vi.fn()} />)

    expect((await screen.findByRole('alert')).textContent)
      .toContain('No se pudieron cargar los límites de San Juan de Lurigancho.')
  })
})
