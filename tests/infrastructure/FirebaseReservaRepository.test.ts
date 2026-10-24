import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Firestore } from 'firebase/firestore'
import type { CartItem } from '../../src/types/cart'
import { FirebaseReservaRepository } from '../../src/infrastructure/firebase/FirebaseReservaRepository'

const firestoreMocks = vi.hoisted(() => ({
  documents: {} as Record<string, Record<string, unknown>>,
  transactionError: null as string | null,
  listCalls: 0,
}))

vi.mock('firebase/firestore', () => {
  type Ref = { path: string }
  type Write = { kind: 'set' | 'update'; ref: Ref; data: Record<string, unknown> }

  const snapshot = (ref: Ref) => {
    const data = firestoreMocks.documents[ref.path]
    return {
      exists: () => data !== undefined,
      data: () => data,
    }
  }

  return {
    Timestamp: class MockTimestamp {
      constructor(private readonly date: Date) {}
      toDate() { return this.date }
    },
    collection: (_db: object, name: string) => ({ path: name }),
    doc: (parent: { path?: string }, ...segments: string[]) => ({
      path: [parent.path, ...segments].filter(Boolean).join('/'),
    }),
    getDoc: async (ref: Ref) => snapshot(ref),
    getDocs: async (ref: Ref) => {
      firestoreMocks.listCalls += 1
      const prefix = `${ref.path}/`
      const docs = Object.entries(firestoreMocks.documents)
        .filter(([path]) => path.startsWith(prefix))
        .map(([path, data]) => ({
          id: path.slice(prefix.length),
          data: () => data,
        }))
      return { docs }
    },
    query: (ref: Ref) => ref,
    where: () => ({}),
    runTransaction: async (_db: object, callback: (transaction: {
      get: (ref: Ref) => Promise<ReturnType<typeof snapshot>>
      set: (ref: Ref, data: Record<string, unknown>) => void
      update: (ref: Ref, data: Record<string, unknown>) => void
    }) => Promise<unknown>) => {
      if (firestoreMocks.transactionError) {
        throw Object.assign(new Error('Firestore rechazó la transacción.'), {
          code: firestoreMocks.transactionError,
        })
      }
      const writes: Write[] = []
      const result = await callback({
        get: async (ref) => snapshot(ref),
        set: (ref, data) => writes.push({ kind: 'set', ref, data }),
        update: (ref, data) => writes.push({ kind: 'update', ref, data }),
      })
      for (const write of writes) {
        firestoreMocks.documents[write.ref.path] = write.kind === 'set'
          ? write.data
          : { ...firestoreMocks.documents[write.ref.path], ...write.data }
      }
      return result
    },
    serverTimestamp: () => new Date('2026-01-01T00:00:00.000Z'),
  }
})

vi.mock('../../src/infrastructure/firebase/firebaseClient', () => ({
  getFirebaseAuth: () => ({ currentUser: { uid: 'user-1' } }),
}))

const cartItem: CartItem = {
  id: 'offer-1',
  title: 'Pan',
  place: 'Comercio',
  image: '',
  price: 4,
  quantity: 2,
  maxStock: 4,
}

function setup(assertAdmin = vi.fn(async () => undefined)) {
  const ids = ['movement-1', 'movement-2']
  const idGenerator = { next: () => ids.shift() ?? 'unexpected-id' }
  const reservationIds = { next: vi.fn(() => 'reservation-1') }
  const repository = new FirebaseReservaRepository(
    {} as Firestore,
    idGenerator,
    { assertAdmin },
    reservationIds,
  )
  return { repository, assertAdmin, reservationIds }
}

function seedManagedPair() {
  firestoreMocks.documents['ofertas/offer-1'] = {
    id_producto: 'product-1',
    id_comercio: 'store-1',
    cantidad_disponible: 4,
    estado: 'disponible',
    fecha_limite: new Date(Date.now() + 86_400_000),
    inventory_version: 1,
  }
  firestoreMocks.documents['productos/product-1'] = {
    id_producto: 'product-1',
    id_comercio: 'store-1',
    stock: 4,
    estado: 'activo',
    inventory_version: 1,
    inventory_offer_id: 'offer-1',
  }
}

beforeEach(() => {
  firestoreMocks.documents = {}
  firestoreMocks.transactionError = null
  firestoreMocks.listCalls = 0
})

describe('FirebaseReservaRepository client transactions', () => {
  it('creates a reservation and decrements the managed product and offer together', async () => {
    seedManagedPair()
    const { repository, reservationIds } = setup()

    await expect(repository.create('user-1', 'user@example.com', cartItem, 'maria perez'))
      .resolves.toBe('reservation-1')
    expect(reservationIds.next).toHaveBeenCalledWith('maria perez')

    expect(firestoreMocks.documents['productos/product-1'].stock).toBe(2)
    expect(firestoreMocks.documents['ofertas/offer-1'].cantidad_disponible).toBe(2)
    expect(firestoreMocks.documents['reservas/reservation-1']).toMatchObject({
      id_usuario: 'user-1',
      cantidad: 2,
      estado_reserva: 'pendiente',
      inventory_creation_operation_id: 'movement-1',
    })
    expect(firestoreMocks.documents['inventario_movimientos/movement-1']).toMatchObject({
      tipo: 'reserva_creada',
      stock_producto_antes: 4,
      stock_producto_despues: 2,
      stock_oferta_antes: 4,
      stock_oferta_despues: 2,
    })
  })

  it('rejects invalid quantities and mismatched inventory before writing', async () => {
    seedManagedPair()
    const { repository } = setup()

    await expect(repository.create('user-1', 'user@example.com', {
      ...cartItem,
      quantity: 0,
    })).rejects.toThrow('cantidad')
    firestoreMocks.documents['productos/product-1'].stock = 3
    await expect(repository.create('user-1', 'user@example.com', cartItem))
      .rejects.toThrow('inventario')

    expect(firestoreMocks.documents['ofertas/offer-1'].cantidad_disponible).toBe(4)
    expect(firestoreMocks.documents['reservas/reservation-1']).toBeUndefined()
  })

  it('treats a permission-denied concurrent cancellation as complete only after rereading the cancelled reservation', async () => {
    firestoreMocks.documents['reservas/reservation-1'] = {
      id_reserva: 'reservation-1',
      id_usuario: 'user-1',
      estado_reserva: 'cancelada',
    }
    firestoreMocks.transactionError = 'permission-denied'
    const { repository } = setup()

    await expect(repository.delete('reservation-1')).resolves.toBeUndefined()
  })

  it('surfaces permission errors when the requested state was not persisted', async () => {
    firestoreMocks.documents['reservas/reservation-1'] = {
      id_reserva: 'reservation-1',
      id_usuario: 'user-1',
      estado_reserva: 'pendiente',
    }
    firestoreMocks.transactionError = 'permission-denied'
    const { repository } = setup()

    await expect(repository.delete('reservation-1'))
      .rejects.toMatchObject({ code: 'permission-denied' })
  })

  it('requires admin authorization before administrative status changes', async () => {
    const assertAdmin = vi.fn(async () => { throw new Error('not admin') })
    const { repository } = setup(assertAdmin)

    await expect(repository.updateEstado('reservation-1', 'confirmada')).rejects.toThrow('not admin')
    expect(assertAdmin).toHaveBeenCalledOnce()
  })

  it('lists and maps the current user reservations', async () => {
    firestoreMocks.documents['reservas/reservation-1'] = {
      id_reserva: 'reservation-1',
      id_usuario: 'user-1',
      email_usuario: 'user@example.com',
      id_producto: 'offer-1',
      id_producto_catalogo: 'product-1',
      fecha_reserva: new Date('2026-01-01T00:00:00.000Z'),
      cantidad: 2,
      estado_reserva: 'pendiente',
    }
    const { repository } = setup()

    const reservations = await repository.listByUsuario('user-1')

    expect(firestoreMocks.listCalls).toBe(1)
    expect(reservations[0]).toMatchObject({
      id_reserva: 'reservation-1',
      id_usuario: 'user-1',
      cantidad: 2,
      estado_reserva: 'pendiente',
    })
  })
})
