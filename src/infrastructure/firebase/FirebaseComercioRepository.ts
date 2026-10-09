import { doc, getDoc } from 'firebase/firestore'
import type { ComercioReader, ComercioSummary } from '../../ports/comercioRepository'
import { getFirebaseServices } from './firebaseClient'

function mapComercio(data: Record<string, unknown>): ComercioSummary {
  return {
    businessName: typeof data.businessName === 'string' ? data.businessName : undefined,
    district: typeof data.district === 'string' ? data.district : undefined,
  }
}

export class FirebaseComercioRepository implements ComercioReader {
  async getCommerceById(id: string): Promise<ComercioSummary | null> {
    const { db } = getFirebaseServices()
    const snapshot = await getDoc(doc(db, 'comercios', id))
    return snapshot.exists() ? mapComercio(snapshot.data()) : null
  }
}
