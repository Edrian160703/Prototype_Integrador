import { doc, getDoc, type Firestore } from 'firebase/firestore'
import type { ComercioReader, ComercioSummary } from '../../ports/comercioRepository'

function mapComercio(data: Record<string, unknown>): ComercioSummary {
  return {
    businessName: typeof data.businessName === 'string' ? data.businessName : undefined,
    district: typeof data.district === 'string' ? data.district : undefined,
  }
}

export class FirebaseComercioRepository implements ComercioReader {
  constructor(private readonly db: Firestore) {}

  async getCommerceById(id: string): Promise<ComercioSummary | null> {
    const snapshot = await getDoc(doc(this.db, 'comercios', id))
    return snapshot.exists() ? mapComercio(snapshot.data()) : null
  }
}
