import {
  deleteObject,
  getBlob,
  getDownloadURL,
  ref,
  uploadBytes,
  type FirebaseStorage,
  type StorageReference,
} from 'firebase/storage'
import type { IdGenerator } from '../../ports/idGenerator'
import type {
  ProductPublicationStorage,
  PublicationImageFiles,
  UploadedPublicationImages,
} from '../../ports/productPublicationStorage'

export class FirebaseProductPublicationStorage implements ProductPublicationStorage {
  constructor(
    private readonly storage: FirebaseStorage,
    private readonly idGenerator: IdGenerator,
  ) {}

  async upload(uid: string, images: PublicationImageFiles): Promise<UploadedPublicationImages> {
    const fileId = this.idGenerator.next()
    const foodReference = ref(this.storage, `product-images/${uid}/${fileId}`)
    const expirationReference = ref(this.storage, `product-expiry-evidence/${uid}/${fileId}`)
    const uploaded: StorageReference[] = []

    try {
      await uploadBytes(foodReference, images.food, { contentType: images.food.type })
      uploaded.push(foodReference)
      const foodImageUrl = await getDownloadURL(foodReference)

      await uploadBytes(expirationReference, images.expirationEvidence, {
        contentType: images.expirationEvidence.type,
      })
      uploaded.push(expirationReference)

      return {
        foodImageUrl,
        expirationImagePath: expirationReference.fullPath,
        expirationImageId: fileId,
        cleanup: () => this.removeUploaded(uploaded),
      }
    } catch (error) {
      try {
        await this.removeUploaded(uploaded)
      } catch (cleanupError) {
        console.error('[Limpieza de imágenes] No se pudieron eliminar todos los archivos subidos.', cleanupError)
      }
      throw error
    }
  }

  readPrivateImage(path: string): Promise<Blob> {
    return getBlob(ref(this.storage, path))
  }

  private async removeUploaded(references: StorageReference[]): Promise<void> {
    const results = await Promise.allSettled(references.map((imageRef) => deleteObject(imageRef)))
    const failures = results.filter((result) => result.status === 'rejected')
    if (failures.length > 0) {
      console.error('[Limpieza de imágenes] Falló la eliminación de archivos de Storage.', failures)
      throw new Error('No se pudieron eliminar todas las imágenes de Storage.')
    }
  }
}
