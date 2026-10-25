import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MisPublicaciones from '../../src/components/MisPublicaciones'
import type { OwnedOferta } from '../../src/types/oferta'

const { deleteOffer, getOffers, updateOffer } = vi.hoisted(() => ({
  deleteOffer: vi.fn(),
  getOffers: vi.fn(),
  updateOffer: vi.fn(),
}))

vi.mock('../../src/context/ApplicationContext', () => ({
  useOfferEditing: () => ({ deleteOferta: deleteOffer, updateOferta: updateOffer }),
  useOfferOwnerQuery: () => ({ getOfertasByOwner: getOffers }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const oferta: OwnedOferta = {
  id: 'offer-1',
  data: {
    id_producto: 'product-1',
    id_comercio: 'store-1',
    id_categoria: 'panaderia',
    nombre_producto: 'Pan del día',
    descripcion: 'Pan recién horneado',
    precio_original: 12,
    precio_oferta: 8,
    cantidad_disponible: 4,
    horario_recojo: '17:00 - 19:00 hs',
    estado: 'disponible',
    fecha_limite: new Date('2027-04-08T18:00:00'),
    imagen_url: null,
  },
}

describe('MisPublicaciones', () => {
  it('cancela la confirmación sin eliminar la publicación', async () => {
    getOffers.mockResolvedValue([oferta])
    render(<MisPublicaciones uid="store-1" />)

    await screen.findByText('Pan del día')
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(deleteOffer).not.toHaveBeenCalled()
  })

  it('requiere confirmación visible antes de archivar una publicación', async () => {
    getOffers.mockResolvedValueOnce([oferta]).mockResolvedValueOnce([])
    deleteOffer.mockResolvedValue(undefined)
    render(<MisPublicaciones uid="store-1" />)

    await screen.findByText('Pan del día')
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(screen.getByRole('dialog').textContent).toContain('se conservará para el historial')
    expect(deleteOffer).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Sí, archivar' }))
    await waitFor(() => expect(deleteOffer).toHaveBeenCalledWith('offer-1', 'store-1'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByText('Publicación archivada. Se conserva para proteger el historial de reservas.')).toBeTruthy()
  })
})
