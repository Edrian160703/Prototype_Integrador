import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FirebaseStorage } from 'firebase/storage'
import { FirebaseProductPublicationStorage } from '../../src/infrastructure/firebase/FirebaseProductPublicationStorage'

const storageMocks = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  getBlob: vi.fn(),
  getDownloadURL: vi.fn(),
  ref: vi.fn((_storage: unknown, path: string) => ({ fullPath: path })),
  uploadBytes: vi.fn(),
}))

vi.mock('firebase/storage', () => storageMocks)

describe('FirebaseProductPublicationStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storageMocks.uploadBytes.mockResolvedValue(undefined)
    storageMocks.getDownloadURL.mockImplementation(async (reference: { fullPath: string }) =>
      `https://public.example/${reference.fullPath}?token=food-only`,
    )
    storageMocks.deleteObject.mockResolvedValue(undefined)
  })

  it('only creates a download URL for the public food image and cleans both objects on failure', async () => {
    const repository = new FirebaseProductPublicationStorage(
      {} as FirebaseStorage,
      { next: () => 'file-12345678' },
    )
    const uploaded = await repository.upload('store-1', {
      food: new Blob(['food'], { type: 'image/jpeg' }),
      expirationEvidence: new Blob(['label'], { type: 'image/png' }),
    })

    expect(uploaded.foodImageUrl).toContain('product-images/store-1/file-12345678')
    expect(uploaded.expirationImagePath).toBe('product-expiry-evidence/store-1/file-12345678')
    expect(uploaded.expirationImageId).toBe('file-12345678')
    expect(storageMocks.getDownloadURL).toHaveBeenCalledOnce()

    await uploaded.cleanup()
    expect(storageMocks.deleteObject).toHaveBeenCalledTimes(2)
  })

  it('removes the food image if uploading the private evidence fails', async () => {
    storageMocks.uploadBytes
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('storage unavailable'))
    const repository = new FirebaseProductPublicationStorage(
      {} as FirebaseStorage,
      { next: () => 'file-12345678' },
    )

    await expect(repository.upload('store-1', {
      food: new Blob(['food'], { type: 'image/jpeg' }),
      expirationEvidence: new Blob(['label'], { type: 'image/png' }),
    })).rejects.toThrow('storage unavailable')
    expect(storageMocks.deleteObject).toHaveBeenCalledOnce()
    expect(storageMocks.getDownloadURL).toHaveBeenCalledOnce()
    expect(storageMocks.getDownloadURL.mock.calls[0][0].fullPath)
      .toBe('product-images/store-1/file-12345678')
  })
})
