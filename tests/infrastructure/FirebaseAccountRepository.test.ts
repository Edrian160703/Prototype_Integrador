import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Firestore } from 'firebase/firestore'
import { FirebaseAccountRepository } from '../../src/infrastructure/firebase/FirebaseAccountRepository'

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: class Timestamp {},
  updateDoc: vi.fn(),
}))

vi.mock('firebase/firestore', () => firestoreMocks)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FirebaseAccountRepository admin authorization', () => {
  it('reads the available contact details for managed accounts', async () => {
    const createdAt = new Date('2025-01-01T00:00:00Z')
    firestoreMocks.collection.mockReturnValue('consumers')
    firestoreMocks.getDocs.mockResolvedValueOnce({
      docs: [{
        id: 'consumer-1',
        data: () => ({
          uid: 'consumer-uid',
          displayName: 'Ada Lovelace',
          email: 'ada@example.com',
          dni: '12345678',
          phone: '999111222',
          createdAt,
          updatedAt: createdAt,
        }),
      }],
    }).mockResolvedValueOnce({
      docs: [{
        id: 'store-1',
        data: () => ({
          uid: 'store-1',
          displayName: 'Mercado Central',
          email: 'store@example.com',
          ruc: '20123456789',
          phone: '999111222',
          address: 'Av. Principal 123',
          createdAt,
          updatedAt: createdAt,
        }),
      }],
    })
    const repository = new FirebaseAccountRepository(
      {} as Firestore,
      { assertAdmin: vi.fn().mockResolvedValue(undefined) },
    )

    const consumers = await repository.listByRole('consumer')
    const stores = await repository.listByRole('store')

    expect(consumers[0]).toMatchObject({
      id: 'consumer-1',
      uid: 'consumer-uid',
      dni: '12345678',
      phone: '999111222',
    })
    expect(stores[0]).toMatchObject({
      id: 'store-1',
      ruc: '20123456789',
      phone: '999111222',
      address: 'Av. Principal 123',
    })
  })

  it('blocks account reads and writes before accessing Firestore when the user is not an admin', async () => {
    const adminAuthorizer = {
      assertAdmin: vi.fn(async () => {
        throw new Error('No tienes permiso para ejecutar operaciones administrativas.')
      }),
    }
    const repository = new FirebaseAccountRepository({} as Firestore, adminAuthorizer)

    await expect(repository.listByRole('consumer')).rejects.toThrow('No tienes permiso')
    await expect(repository.setStatus('consumer-1', 'consumer', 'suspendida')).rejects.toThrow('No tienes permiso')
    await expect(repository.delete('consumer-1', 'consumer')).rejects.toThrow('No tienes permiso')

    expect(adminAuthorizer.assertAdmin).toHaveBeenCalledTimes(3)
    expect(firestoreMocks.getDocs).not.toHaveBeenCalled()
    expect(firestoreMocks.updateDoc).not.toHaveBeenCalled()
    expect(firestoreMocks.deleteDoc).not.toHaveBeenCalled()
  })
})
