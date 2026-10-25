import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Firestore } from 'firebase/firestore'
import { FirebaseAccountRepository } from '../../src/infrastructure/firebase/FirebaseAccountRepository'

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
}))

vi.mock('firebase/firestore', () => firestoreMocks)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FirebaseAccountRepository admin authorization', () => {
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
