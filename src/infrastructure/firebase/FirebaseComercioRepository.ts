import type { Firestore } from 'firebase/firestore'
import type { ComercioReader, ComercioSummary } from '../../ports/comercioRepository'
import { createUserDocumentPolicies } from './userDocumentPolicies'
import type { UserDocumentFinder } from './userDocumentFinders'

function mapComercio(data: Record<string, unknown>): ComercioSummary {
  return {
    businessName: typeof data.businessName === 'string' ? data.businessName : undefined,
    district: typeof data.district === 'string' ? data.district : undefined,
  }
}

export class FirebaseComercioRepository implements ComercioReader {
  constructor(
    db: Firestore,
    private readonly finder: UserDocumentFinder = createUserDocumentPolicies(db).comercios.finder,
  ) {}

  async getCommerceById(id: string): Promise<ComercioSummary | null> {
    const snapshot = await this.finder.find('comercios', id)
    return snapshot ? mapComercio(snapshot.data() ?? {}) : null
  }
}
