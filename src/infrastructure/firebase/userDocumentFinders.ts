import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore'
import type { UserCollectionName } from './userCollections'

/** Encuentra el documento de un usuario a partir de su uid, sin importar cómo se llame el documento. */
export interface UserDocumentFinder {
  find(collectionName: UserCollectionName, uid: string): Promise<DocumentSnapshot | null>
}

/** El documento se llama igual que el uid: lectura directa. */
export class UidDocumentFinder implements UserDocumentFinder {
  constructor(private readonly db: Firestore) {}

  async find(collectionName: UserCollectionName, uid: string): Promise<DocumentSnapshot | null> {
    const snapshot = await getDoc(doc(collection(this.db, collectionName), uid))
    return snapshot.exists() ? snapshot : null
  }
}

/**
 * El documento tiene un ID legible: se busca por el campo "uid" guardado en él.
 * Si no aparece, prueba el ID antiguo (uid) para no romper cuentas ya creadas.
 */
export class UidFieldDocumentFinder implements UserDocumentFinder {
  private readonly legacyFinder: UserDocumentFinder

  constructor(private readonly db: Firestore) {
    this.legacyFinder = new UidDocumentFinder(db)
  }

  async find(collectionName: UserCollectionName, uid: string): Promise<DocumentSnapshot | null> {
    const matches = await getDocs(
      query(collection(this.db, collectionName), where('uid', '==', uid), limit(1)),
    )
    if (!matches.empty) return matches.docs[0]
    return this.legacyFinder.find(collectionName, uid)
  }
}
