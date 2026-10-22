import { describe, expect, it, vi } from 'vitest'
import type { ReservaDeleter } from '../../src/ports/reservaRepository'
import { cancelarReserva } from '../../src/application/reservas'

describe('cancelarReserva', () => {
  it('elimina usando únicamente el identificador de la reserva', async () => {
    const repository: ReservaDeleter = {
      delete: vi.fn().mockResolvedValue(undefined),
    }

    await cancelarReserva(repository, 'reservation-42')

    expect(repository.delete).toHaveBeenCalledOnce()
    expect(repository.delete).toHaveBeenCalledWith('reservation-42')
  })
})
