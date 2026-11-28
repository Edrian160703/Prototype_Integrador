import { doc, getDoc, type Firestore } from 'firebase/firestore'
import type { ProductExpirationEvidenceReader } from '../../ports/productoRepository'
import type { ProductPublicationStorage } from '../../ports/productPublicationStorage'
import { isValidDateOnly } from '../../utils/dateOnly'

export class FirebaseProductExpirationEvidenceReader implements ProductExpirationEvidenceReader {
  constructor(
    private readonly db: Firestore,
    private readonly storage: ProductPublicationStorage,
    private readonly assertAdmin: () => Promise<void>,
  ) {}

  async getForAdmin(idProducto: string): Promise<{ expirationDate: string; image: Blob } | null> {
    await this.assertAdmin()
    const snapshot = await getDoc(doc(this.db, 'product_expiration_evidence', idProducto))
    if (!snapshot.exists()) return null

    const data = snapshot.data()
    if (
      data.id_producto !== idProducto ||
      typeof data.uid !== 'string' ||
      typeof data.image_path !== 'string' ||
      !data.image_path.startsWith(`product-expiry-evidence/${data.uid}/`) ||
      typeof data.fecha_reconocida_ia !== 'string' ||
      !isValidDateOnly(data.fecha_reconocida_ia)
    ) {
      throw new Error('La evidencia de vencimiento almacenada no tiene un formato válido.')
    }

    const image = await this.storage.readPrivateImage(data.image_path)
    return { expirationDate: data.fecha_reconocida_ia, image }
  }
}
