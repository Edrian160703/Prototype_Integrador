import { describe, expect, it, vi } from 'vitest'
import { crearReservasDesdeCarrito } from '../../src/application/reservas'
import type { ReservaCreator } from '../../src/ports/reservaRepository'
import type { CartItem } from '../../src/types/cart'

const items = [
  { id: 'oferta-1', quantity: 2 },
  { id: 'oferta-2', quantity: 1 },
] as unknown as CartItem[]

describe('crearReservasDesdeCarrito', () => {
  it('crea una reserva por item enviando el nombre del usuario', async () => {
    const repository: ReservaCreator = {
      create: vi.fn().mockResolvedValueOnce('reserva-1').mockResolvedValueOnce('reserva-2'),
    }

    await expect(
      crearReservasDesdeCarrito(repository, 'user-1', 'maria@mail.com', items, 'maria perez'),
    ).resolves.toEqual(['reserva-1', 'reserva-2'])

    expect(repository.create).toHaveBeenNthCalledWith(1, 'user-1', 'maria@mail.com', items[0], 'maria perez')
    expect(repository.create).toHaveBeenNthCalledWith(2, 'user-1', 'maria@mail.com', items[1], 'maria perez')
  })
})
