import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useMisPublicaciones from '../../src/hooks/useMisPublicaciones'
import type { OwnedOferta } from '../../src/types/oferta'

const mocks = vi.hoisted(() => ({
  getOfertasByOwner: vi.fn(),
  updateOferta: vi.fn(),
  deleteOferta: vi.fn(),
}))

vi.mock('../../src/context/ApplicationContext', () => ({
  useOfferEditing: () => ({
    updateOferta: mocks.updateOferta,
    deleteOferta: mocks.deleteOferta,
  }),
  useOfferOwnerQuery: () => ({
    getOfertasByOwner: mocks.getOfertasByOwner,
  }),
}))

function publicacion(id: string): OwnedOferta {
  return {
    id,
    data: {
      id_producto: `product-${id}`,
      id_comercio: 'store-1',
      id_categoria: 'panaderia',
      nombre_producto: `Publicación ${id}`,
      descripcion: 'Pan recién horneado',
      precio_original: 12,
      precio_oferta: 8,
      cantidad_disponible: 4,
      horario_recojo: '17:00-19:00',
      estado: 'disponible',
      fecha_limite: new Date('2026-10-10T19:00:00'),
      imagen_url: null,
    },
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('useMisPublicaciones', () => {
  beforeEach(() => {
    mocks.getOfertasByOwner.mockReset()
    mocks.updateOferta.mockReset().mockResolvedValue(undefined)
    mocks.deleteOferta.mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
  })

  it('ignora la respuesta de una solicitud obsoleta tras cambiar de usuario', async () => {
    const oldRequest = deferred<OwnedOferta[]>()
    const currentRequest = deferred<OwnedOferta[]>()
    mocks.getOfertasByOwner
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(currentRequest.promise)

    const { result, rerender } = renderHook(({ uid }) => useMisPublicaciones(uid), {
      initialProps: { uid: 'user-1' },
    })
    rerender({ uid: 'user-2' })

    await act(async () => {
      currentRequest.resolve([publicacion('new')])
      await currentRequest.promise
    })
    await waitFor(() => expect(result.current.publicaciones).toEqual([publicacion('new')]))

    await act(async () => {
      oldRequest.resolve([publicacion('old')])
      await oldRequest.promise
    })
    expect(result.current.publicaciones).toEqual([publicacion('new')])
    expect(result.current.loading).toBe(false)
    expect(mocks.getOfertasByOwner).toHaveBeenNthCalledWith(1, 'user-1')
    expect(mocks.getOfertasByOwner).toHaveBeenNthCalledWith(2, 'user-2')
  })

  it('no muestra el error de una solicitud obsoleta si la solicitud actual tuvo éxito', async () => {
    const oldRequest = deferred<OwnedOferta[]>()
    const currentRequest = deferred<OwnedOferta[]>()
    mocks.getOfertasByOwner
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(currentRequest.promise)

    const { result, rerender } = renderHook(({ uid }) => useMisPublicaciones(uid), {
      initialProps: { uid: 'user-1' },
    })
    rerender({ uid: 'user-2' })

    await act(async () => {
      currentRequest.resolve([publicacion('current')])
      await currentRequest.promise
    })
    await waitFor(() => expect(result.current.publicaciones).toEqual([publicacion('current')]))

    await act(async () => {
      oldRequest.reject(new Error('error de solicitud antigua'))
      await oldRequest.promise.catch(() => undefined)
    })
    expect(result.current.error).toBe('')
    expect(result.current.loading).toBe(false)
  })

  it('expone errores de carga y permite recargar manualmente con éxito', async () => {
    mocks.getOfertasByOwner
      .mockRejectedValueOnce(new Error('No hay conexión'))
      .mockResolvedValueOnce([publicacion('recargada')])

    const { result } = renderHook(() => useMisPublicaciones('user-1'))
    await waitFor(() => {
      expect(result.current.error).toBe('No hay conexión')
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.loadPublicaciones()
    })

    expect(mocks.getOfertasByOwner).toHaveBeenCalledTimes(2)
    expect(result.current.publicaciones).toEqual([publicacion('recargada')])
    expect(result.current.error).toBe('')
    expect(result.current.loading).toBe(false)
  })
})
