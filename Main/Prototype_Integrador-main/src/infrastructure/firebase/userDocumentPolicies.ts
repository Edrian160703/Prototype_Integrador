import type { Firestore } from 'firebase/firestore'
import type { UserCollectionName } from './userCollections'
import { UidDocumentFinder, UidFieldDocumentFinder, type UserDocumentFinder } from './userDocumentFinders'
import {
  ReadableNameDocumentIdStrategy,
  UidDocumentIdStrategy,
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
      ids: new UidDocumentIdStrategy(),
      finder: new UidDocumentFinder(db),
    },
  }
}
