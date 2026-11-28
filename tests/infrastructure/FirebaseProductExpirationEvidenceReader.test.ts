import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Firestore } from 'firebase/firestore'
import type { ProductPublicationStorage } from '../../src/ports/productPublicationStorage'
import { FirebaseProductExpirationEvidenceReader } from '../../src/infrastructure/firebase/FirebaseProductExpirationEvidenceReader'

const firestoreMocks = vi.hoisted(() => ({
  data: null as Record<string, unknown> | null,
  getDoc: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  doc: (_db: object, collection: string, id: string) => ({ path: `${collection}/${id}` }),
  getDoc: firestoreMocks.getDoc,
}))

describe('FirebaseProductExpirationEvidenceReader', () => {
  beforeEach(() => {
    firestoreMocks.data = null
    firestoreMocks.getDoc.mockImplementation(async () => ({
      exists: () => firestoreMocks.data !== null,
      data: () => firestoreMocks.data,
    }))
  })

  it('requires an admin assertion and reads the private image by Storage path', async () => {
    firestoreMocks.data = {
      id_producto: 'product-1',
      uid: 'store-1',
      image_path: 'product-expiry-evidence/store-1/image-1',
      fecha_reconocida_ia: '2027-05-09',
    }
    const assertAdmin = vi.fn().mockResolvedValue(undefined)
    const image = new Blob(['private evidence'], { type: 'image/png' })
    const storage: ProductPublicationStorage = {
      upload: vi.fn(),
      readPrivateImage: vi.fn().mockResolvedValue(image),
    }
    const reader = new FirebaseProductExpirationEvidenceReader(
      {} as Firestore,
      storage,
      assertAdmin,
    )

    await expect(reader.getForAdmin('product-1')).resolves.toEqual({
      expirationDate: '2027-05-09',
      image,
    })
    expect(assertAdmin).toHaveBeenCalledOnce()
    expect(storage.readPrivateImage).toHaveBeenCalledWith(
      'product-expiry-evidence/store-1/image-1',
    )
  })

  it('does not request the image when evidence metadata is absent', async () => {
    const storage: ProductPublicationStorage = {
      upload: vi.fn(),
      readPrivateImage: vi.fn(),
    }
    const reader = new FirebaseProductExpirationEvidenceReader(
      {} as Firestore,
      storage,
      vi.fn().mockResolvedValue(undefined),
    )

    await expect(reader.getForAdmin('legacy-product')).resolves.toBeNull()
    expect(storage.readPrivateImage).not.toHaveBeenCalled()
  })
})
