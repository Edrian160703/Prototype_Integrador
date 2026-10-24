import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Firestore } from 'firebase/firestore'
import { FirebaseOfertaRepository } from '../../src/infrastructure/firebase/FirebaseOfertaRepository'
import type { OfertaPayload } from '../../src/types/oferta'

const firestoreMocks = vi.hoisted(() => ({
  documents: {} as Record<string, Record<string, unknown>>,
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
    collection: (_db: object, name: string) => ({ path: name }),
    doc: (parent: { path?: string }, ...segments: string[]) => ({
      path: [parent.path, ...segments].filter(Boolean).join('/'),
    }),
    getDoc: async (ref: Ref) => snapshot(ref),
    getDocs: async () => ({ docs: [] }),
    orderBy: () => ({}),
    query: (ref: Ref) => ref,
    runTransaction: async (_db: object, callback: (transaction: {
      get: (ref: Ref) => Promise<ReturnType<typeof snapshot>>
      set: (ref: Ref, data: Record<string, unknown>) => void
      update: (ref: Ref, data: Record<string, unknown>) => void
    }) => Promise<unknown>) => {
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
    where: () => ({}),
  }
})

const payload: Omit<OfertaPayload, 'estado'> = {
  nombre_producto: 'Pan integral',
  id_categoria: 'panaderia',
  descripcion: 'Pan recién horneado',
  precio_original: 16,
  precio_oferta: 10,
  cantidad_disponible: 3,
  horario_recojo: '18:00 - 20:00 hs',
  fecha_limite: '2027-05-09T19:00',
  imagen_url: 'https://example.com/pan.jpg',
}

function setup(ids = ['movement-12345678']) {
  const idGenerator = { next: () => ids.shift() ?? 'unexpected-id' }
  return new FirebaseOfertaRepository({} as Firestore, idGenerator)
}

function seedUnlinkedProduct() {
  firestoreMocks.documents['productos/product-1'] = {
    id_producto: 'product-1',
    id_comercio: 'store-1',
    stock: payload.cantidad_disponible,
    estado: 'activo',
    inventory_version: 1,
    inventory_offer_id: null,
  }
}

function seedManagedOffer() {
  firestoreMocks.documents['productos/product-1'] = {
    id_producto: 'product-1',
    id_comercio: 'store-1',
    stock: 5,
    estado: 'activo',
    inventory_version: 1,
    inventory_offer_id: 'offer-1',
  }
  firestoreMocks.documents['ofertas/offer-1'] = {
    ...payload,
    id_producto: 'product-1',
    id_comercio: 'store-1',
    cantidad_disponible: 5,
    estado: 'disponible',
    inventory_version: 1,
  }
}

beforeEach(() => {
  firestoreMocks.documents = {}
})

describe('FirebaseOfertaRepository Spark transactions', () => {
  it('creates the offer, links the product and writes an immutable movement atomically', async () => {
    seedUnlinkedProduct()
    const repository = setup()

    await expect(repository.create(
      'store-1',
      { ...payload, estado: 'disponible' },
      'product-1',
      'offer-1',
    )).resolves.toBe('offer-1')

    expect(firestoreMocks.documents['productos/product-1'].inventory_offer_id).toBe('offer-1')
    expect(firestoreMocks.documents['ofertas/offer-1']).toMatchObject({
      id_producto: 'product-1',
      id_comercio: 'store-1',
      cantidad_disponible: 3,
      inventory_version: 1,
    })
    expect(firestoreMocks.documents['inventario_movimientos/movement-12345678'])
      .toMatchObject({ tipo: 'oferta_vinculada', uid: 'store-1' })
  })

  it('updates offer and product inventory together and archives offers without deleting them', async () => {
    seedManagedOffer()
    const repository = setup(['movement-12345678', 'movement-abcdefgh'])

    await repository.updateOwned('offer-1', 'store-1', {
      ...payload,
      cantidad_disponible: 3,
    })
    expect(firestoreMocks.documents['productos/product-1'].stock).toBe(3)
    expect(firestoreMocks.documents['ofertas/offer-1'].cantidad_disponible).toBe(3)
    expect(firestoreMocks.documents['inventario_movimientos/movement-12345678'])
      .toMatchObject({ tipo: 'stock_ajustado', cantidad: 3 })

    await repository.deleteOwned('offer-1', 'store-1')
    expect(firestoreMocks.documents['ofertas/offer-1'].estado).toBe('archivada')
    expect(firestoreMocks.documents['ofertas/offer-1'].archivedAt).toBeInstanceOf(Date)
  })

  it('blocks legacy or mismatched inventory without writing', async () => {
    firestoreMocks.documents['productos/product-1'] = {
      id_producto: 'product-1',
      id_comercio: 'store-1',
      stock: 5,
      estado: 'activo',
    }
    const repository = setup()

    await expect(repository.create(
      'store-1',
      { ...payload, estado: 'disponible' },
      'product-1',
      'offer-1',
    )).rejects.toThrow('vincular una oferta')
    expect(firestoreMocks.documents['ofertas/offer-1']).toBeUndefined()
    expect(firestoreMocks.documents['inventario_movimientos/movement-12345678']).toBeUndefined()
  })
})
