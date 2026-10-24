import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FormEvent } from 'react'
import type { OwnedOferta } from '../../src/types/oferta'
import useMisPublicaciones from '../../src/hooks/useMisPublicaciones'

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

describe('useMisPublicaciones', () => {
  it('valida y actualiza una publicación, recargando el listado una sola vez', async () => {
    getOffers.mockResolvedValue([oferta])
    updateOffer.mockResolvedValue(undefined)
    const { result } = renderHook(() => useMisPublicaciones('store-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.selectOferta(oferta))
    act(() => result.current.updateValue('precio_oferta', '12'))
    await act(async () => {
      await result.current.submitEdit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>)
    })

    expect(result.current.error).toBe('El precio de oferta debe ser menor al precio original.')
    expect(updateOffer).not.toHaveBeenCalled()

    act(() => result.current.updateValue('precio_oferta', '7'))
    await act(async () => {
      await result.current.submitEdit({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>)
    })

    expect(updateOffer).toHaveBeenCalledWith(
      'offer-1',
      'store-1',
      expect.objectContaining({ precio_original: 12, precio_oferta: 7 }),
    )
    expect(getOffers).toHaveBeenCalledTimes(2)
    expect(result.current.message).toBe('Publicación actualizada correctamente.')
    expect(result.current.seleccionada).toBeNull()
  })

  it('archiva por identificador sin solicitar confirmación al navegador', async () => {
    getOffers.mockResolvedValue([oferta])
    deleteOffer.mockResolvedValue(undefined)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { result } = renderHook(() => useMisPublicaciones('store-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.removeOferta(oferta.id)
    })

    expect(deleteOffer).toHaveBeenCalledWith('offer-1', 'store-1')
    expect(confirm).not.toHaveBeenCalled()
    expect(getOffers).toHaveBeenCalledTimes(2)
    expect(result.current.message).toBe('Publicación archivada. Se conserva para proteger el historial de reservas.')
  })

  it('expone el error de eliminación y libera el estado de carga si falla', async () => {
    getOffers.mockResolvedValue([oferta])
    deleteOffer.mockRejectedValue(new Error('Firestore no disponible'))
    const { result } = renderHook(() => useMisPublicaciones('store-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.removeOferta(oferta.id)
    })

    expect(result.current.error).toBe('Firestore no disponible')
    expect(result.current.deletingId).toBeNull()
    expect(result.current.message).toBe('')
    expect(getOffers).toHaveBeenCalledOnce()
  })
})
