import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState, type ReactNode } from 'react'
import MapaNegocio from '../../src/components/MapaNegocio'
import type { BusinessCoordinates } from '../../src/types/user'

const mapMocks = vi.hoisted(() => ({
  clickHandler: undefined as undefined | ((event: { latlng: { lat: number; lng: number } }) => void),
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
})

function ControlledMap() {
  const [location, setLocation] = useState<BusinessCoordinates | null>(null)
  return <MapaNegocio selectedLocation={location} onSelect={setLocation} />
}

function mockGeoJsonFetch() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => boundary,
  }))
}

describe('MapaNegocio', () => {
  it('carga el límite y actualiza el marcador al seleccionar nuevos puntos', async () => {
    mockGeoJsonFetch()
    render(<ControlledMap />)

    await waitFor(() => expect(mapMocks.clickHandler).toBeDefined())
    expect(fetch).toHaveBeenCalledWith('/mapas/sjl.geojson')

    act(() => mapMocks.clickHandler?.({ latlng: { lat: 0.5, lng: 0.5 } }))
    expect((await screen.findByTestId('business-marker')).textContent).toBe('0.5,0.5')

    act(() => mapMocks.clickHandler?.({ latlng: { lat: -0.5, lng: -0.5 } }))
    await waitFor(() => expect(screen.getByTestId('business-marker').textContent).toBe('-0.5,-0.5'))
  })

  it('restaura en el mapa una ubicación válida ya guardada', async () => {
    mockGeoJsonFetch()
    render(
      <MapaNegocio
        selectedLocation={{ latitude: 0.25, longitude: -0.25 }}
        onSelect={vi.fn()}
      />,
    )

    expect((await screen.findByTestId('business-marker')).textContent).toBe('0.25,-0.25')
  })

  it('muestra un mensaje y no cambia la ubicación al hacer clic fuera del límite', async () => {
    mockGeoJsonFetch()
    const onSelect = vi.fn()
    render(<MapaNegocio selectedLocation={null} onSelect={onSelect} />)

    await waitFor(() => expect(mapMocks.clickHandler).toBeDefined())
    act(() => mapMocks.clickHandler?.({ latlng: { lat: 0, lng: 2 } }))

    expect(screen.getByRole('alert').textContent).toContain('fuera de San Juan de Lurigancho')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('muestra error si no se carga el GeoJSON oficial', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    render(<MapaNegocio selectedLocation={null} onSelect={vi.fn()} />)

    expect((await screen.findByRole('alert')).textContent)
      .toContain('No se pudieron cargar los límites oficiales de SJL')
  })
})
