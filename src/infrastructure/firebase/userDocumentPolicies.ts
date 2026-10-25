import type { Firestore } from 'firebase/firestore'
import type { UserCollectionName } from './userCollections'
import { UidFieldDocumentFinder, type UserDocumentFinder } from './userDocumentFinders'
import {
  READABLE_ID_UID_LENGTH,
  ReadableNameDocumentIdStrategy,
  STORE_FALLBACK_NAME,
  type UserDocumentIdStrategy,
} from './userDocumentIds'

export interface UserDocumentPolicy {
  readonly ids: UserDocumentIdStrategy
  readonly finder: UserDocumentFinder
}

export type UserDocumentPolicies = Record<UserCollectionName, UserDocumentPolicy>

/**
 * Único lugar donde se decide cómo se nombra y se encuentra el documento de cada colección.
 * Para cambiar la regla de "comercios" basta con cambiar su entrada aquí.
 */
export function createUserDocumentPolicies(db: Firestore): UserDocumentPolicies {
  return {
    consumidores: {
      ids: new ReadableNameDocumentIdStrategy(),
      finder: new UidFieldDocumentFinder(db),
    },
    comercios: {
      ids: new ReadableNameDocumentIdStrategy(READABLE_ID_UID_LENGTH, STORE_FALLBACK_NAME),
      finder: new UidFieldDocumentFinder(db),
    },
  }
}
