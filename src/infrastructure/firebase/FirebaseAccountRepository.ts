import { collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import type {
  AccountReader,
  AccountStatus,
  AccountWriter,
  ManagedAccount,
} from '../../ports/accountRepository'
import type { UserRole } from '../../types/user'
import { getFirebaseServices } from './firebaseClient'
import { toDate } from './firestoreDates'
import { getUserCollectionName } from './userCollections'

export class FirebaseAccountRepository implements AccountReader, AccountWriter {
  async listByRole(role: UserRole): Promise<ManagedAccount[]> {
    const { db } = getFirebaseServices()
    const snapshot = await getDocs(collection(db, getUserCollectionName(role)))
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
        lastActiveAt: toDate(data.updatedAt ?? data.createdAt ?? new Date()),
      }
    })
  }

  async setStatus(id: string, role: UserRole, status: AccountStatus): Promise<void> {
    const { db } = getFirebaseServices()
    await updateDoc(doc(db, getUserCollectionName(role), id), {
      accountStatus: status,
      updatedAt: serverTimestamp(),
    })
  }

  async delete(id: string, role: UserRole): Promise<void> {
    const { db } = getFirebaseServices()
    await deleteDoc(doc(db, getUserCollectionName(role), id))
  }
}
