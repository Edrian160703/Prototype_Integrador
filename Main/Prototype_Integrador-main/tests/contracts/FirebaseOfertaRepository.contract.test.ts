import { vi } from 'vitest'
import { runOfertaWriterContract, type OfertaWriterContractFixture } from './ofertaWriterContract'
import { FirebaseOfertaRepository } from '../../src/infrastructure/firebase/FirebaseOfertaRepository'
import type { Firestore } from 'firebase/firestore'

const firestoreMock = vi.hoisted(() => ({
  documents: new Map<string, Record<string, unknown>>(),
}))

vi.mock('firebase/firestore', () => {
  class MockTimestamp {
    constructor(private readonly date: Date) {}

    static fromDate(date: Date) {
      return new MockTimestamp(date)
    }

    toDate() {
      return this.date
    }
  }

  function documentKey(collectionName: string, id: string): string {
    return `${collectionName}/${id}`
  }

  return {
    Timestamp: MockTimestamp,
    collection: (db: object, name: string) => ({ db, collectionName: name }),
    doc: (target: { db?: object; collectionName?: string }, nameOrId: string, id?: string) => {
      if (id) return { key: documentKey(nameOrId, id) }
      if (!target.collectionName) throw new Error('Invalid collection reference')
      return { key: documentKey(target.collectionName, nameOrId) }
    },
    getDoc: async (reference: { key: string }) => {
      const data = firestoreMock.documents.get(reference.key)
      return {
        exists: () => data !== undefined,
        data: () => data,
      }
    },
    updateDoc: async (reference: { key: string }, data: Record<string, unknown>) => {
      const current = firestoreMock.documents.get(reference.key)
      if (!current) throw new Error('Document does not exist')
      firestoreMock.documents.set(reference.key, { ...current, ...data })
    },
    deleteDoc: async (reference: { key: string }) => {
      firestoreMock.documents.delete(reference.key)
    },
    setDoc: async (reference: { key: string }, data: Record<string, unknown>) => {
      firestoreMock.documents.set(reference.key, data)
    },
    getDocs: async () => ({ docs: [] }),
    orderBy: () => ({}),
    query: () => ({}),
    where: () => ({}),
  }
})

function createFirebaseFixture(): OfertaWriterContractFixture {
  firestoreMock.documents.clear()
  const repository = new FirebaseOfertaRepository({} as Firestore)

  return {
    writer: repository,
    async seed(ownerId) {
      const id = 'offer-1'
      firestoreMock.documents.set(`ofertas/${id}`, {
        id_producto: 'product-1',
        id_comercio: ownerId,
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
      })
      return id
    },
    async read(id) {
      return firestoreMock.documents.get(`ofertas/${id}`) ?? null
    },
  }
}

runOfertaWriterContract('FirebaseOfertaRepository', createFirebaseFixture)
