import {
  collection,
  deleteDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import type {
  AccountReader,
  AccountStatus,
  AccountWriter,
  ManagedAccount,
} from '../../ports/accountRepository'
import type { UserRole } from '../../types/user'
import { toDate } from './firestoreDates'
import { getUserCollectionName } from './userCollections'
import { UidFieldDocumentFinder } from './userDocumentFinders'

interface AccountAdminAuthorizer {
  assertAdmin(): Promise<void>
}

const DEFAULT_ADMIN_AUTHORIZER: AccountAdminAuthorizer = {
  assertAdmin: async () => {
    throw new Error('Las operaciones administrativas requieren autorización.')
  },
}

export class FirebaseAccountRepository implements AccountReader, AccountWriter {
  private readonly documentFinder: UidFieldDocumentFinder

  constructor(
    private readonly db: Firestore,
    private readonly adminAuthorizer: AccountAdminAuthorizer = DEFAULT_ADMIN_AUTHORIZER,
  ) {
    this.documentFinder = new UidFieldDocumentFinder(db)
  }

  async listByRole(role: UserRole): Promise<ManagedAccount[]> {
    await this.adminAuthorizer.assertAdmin()
    const snapshot = await getDocs(query(
      collection(this.db, getUserCollectionName(role)),
      orderBy('createdAt', 'desc'),
    ))
    return snapshot.docs.map((item) => {
      const data = item.data()
      const uid = typeof data.uid === 'string' ? data.uid : item.id
      const createdAt = data.createdAt === undefined || data.createdAt === null
        ? new Date()
        : toDate(data.createdAt)

      const dni = typeof data.dni === 'string' ? data.dni : undefined
      const phone = typeof data.phone === 'string' ? data.phone : undefined
      const ruc = typeof data.ruc === 'string' ? data.ruc : undefined
      const address = typeof data.address === 'string' ? data.address : undefined

      return {
        id: uid,
        role,
        displayName: typeof data.displayName === 'string'
          ? data.displayName
          : typeof data.email === 'string' ? data.email : 'Usuario',
        email: typeof data.email === 'string' ? data.email : '',
        dni,
        phone,
        ruc,
        address,
        status: data.accountStatus === 'suspendida' || data.accountStatus === 'pendiente'
          ? data.accountStatus
          : 'activa',
        createdAt,
        lastActiveAt: toDate(data.updatedAt ?? data.createdAt ?? new Date()),
      }
    })
  }

  async setStatus(id: string, role: UserRole, status: AccountStatus): Promise<void> {
    await this.adminAuthorizer.assertAdmin()
    const documentRef = await this.findReferenceByUid(role, id)
    await updateDoc(documentRef, {
      accountStatus: status,
      updatedAt: serverTimestamp(),
    })
  }

  async delete(id: string, role: UserRole): Promise<void> {
    await this.adminAuthorizer.assertAdmin()
    const documentRef = await this.findReferenceByUid(role, id)
    await deleteDoc(documentRef)
  }

  private async findReferenceByUid(role: UserRole, uid: string) {
    const collectionName = getUserCollectionName(role)
    const snapshot = await this.documentFinder.find(collectionName, uid)
    if (!snapshot) {
      throw new Error(`No existe el perfil ${uid} en la colección "${collectionName}".`)
    }
    return snapshot.ref
  }
}
