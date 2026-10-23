import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReservaConOferta } from '../../src/types/reserva'
import useMisReservas from '../../src/hooks/useMisReservas'

const { cancelReservation, getReservations } = vi.hoisted(() => ({
  cancelReservation: vi.fn(),
  getReservations: vi.fn(),
}))

vi.mock('../../src/context/ApplicationContext', () => ({
  useReservationHistory: () => ({ getReservasByUsuario: getReservations }),
  useReservationManagement: () => ({ cancelarReserva: cancelReservation }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const reservation: ReservaConOferta = {
  id_reserva: 'reservation-42',
  id_usuario: 'user-1',
  email_usuario: 'user@example.com',
  id_producto: 'product-7',
  fecha_reserva: new Date('2026-10-20T12:00:00Z'),
  cantidad: 2,
  estado_reserva: 'pendiente',
  nombre_producto: 'Pan integral',
  imagen_url: null,
  precio_oferta: 5,
  horario_recojo: '17:00 - 19:00',
}

describe('useMisReservas', () => {
  it('cancela la reserva seleccionada pasando solo su identificador', async () => {
    getReservations.mockResolvedValue([reservation])
    cancelReservation.mockResolvedValue(undefined)
    const { result } = renderHook(() => useMisReservas('user-1'))

    await act(async () => {
      await Promise.resolve()
    })
    act(() => result.current.selectReservaToDelete(reservation))
    await act(async () => {
      await result.current.confirmDelete()
    })

    expect(cancelReservation).toHaveBeenCalledOnce()
    expect(cancelReservation).toHaveBeenCalledWith('reservation-42')
    expect(result.current.reservas).toEqual([])
  })

  it('conserva la reserva y expone el error si falla la cancelación', async () => {
    getReservations.mockResolvedValue([reservation])
    cancelReservation.mockRejectedValue(new Error('Firestore no disponible'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { result } = renderHook(() => useMisReservas('user-1'))

    await act(async () => {
      await Promise.resolve()
    })
    act(() => result.current.selectReservaToDelete(reservation))
    await act(async () => {
      await result.current.confirmDelete()
    })

    expect(result.current.reservas).toEqual([reservation])
    expect(result.current.errorCancelId).toBe('reservation-42')
    expect(result.current.cancelandoId).toBeNull()
    expect(consoleError).toHaveBeenCalledWith(
      'Error al cancelar la reserva',
      expect.any(Error),
    )
  })
})
