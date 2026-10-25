import { collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc, type Firestore } from 'firebase/firestore'
import type {
  AccountReader,
  AccountStatus,
  AccountWriter,
  ManagedAccount,
} from '../../ports/accountRepository'
import type { UserRole } from '../../types/user'
import { toDate } from './firestoreDates'
import { getUserCollectionName } from './userCollections'

interface AccountAdminAuthorizer {
  assertAdmin(): Promise<void>
}

const DEFAULT_ADMIN_AUTHORIZER: AccountAdminAuthorizer = {
  assertAdmin: async () => {
    throw new Error('Las operaciones administrativas requieren autorización.')
  },
}

export class FirebaseAccountRepository implements AccountReader, AccountWriter {
  constructor(
    private readonly db: Firestore,
    private readonly adminAuthorizer: AccountAdminAuthorizer = DEFAULT_ADMIN_AUTHORIZER,
  ) {}

  async listByRole(role: UserRole): Promise<ManagedAccount[]> {
    await this.adminAuthorizer.assertAdmin()
    const snapshot = await getDocs(collection(this.db, getUserCollectionName(role)))
    return snapshot.docs.map((item) => {
      const data = item.data()
      return {
        id: item.id,
        role,
        displayName: typeof data.displayName === 'string'
          ? data.displayName
          : typeof data.email === 'string' ? data.email : 'Usuario',
        email: typeof data.email === 'string' ? data.email : '',
        status: data.accountStatus === 'suspendida' || data.accountStatus === 'pendiente'
          ? data.accountStatus
          : 'activa',
        createdAt: data.createdAt === undefined || data.createdAt === null
          ? null
          : toDate(data.createdAt),
        lastActiveAt: toDate(data.updatedAt ?? data.createdAt ?? new Date()),
      }
    })
  }

  async setStatus(id: string, role: UserRole, status: AccountStatus): Promise<void> {
    await this.adminAuthorizer.assertAdmin()
    await updateDoc(doc(this.db, getUserCollectionName(role), id), {
      accountStatus: status,
      updatedAt: serverTimestamp(),
    })
  }

  async delete(id: string, role: UserRole): Promise<void> {
    await this.adminAuthorizer.assertAdmin()
    await deleteDoc(doc(this.db, getUserCollectionName(role), id))
  }
}
