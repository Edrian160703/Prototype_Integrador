import { collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { getFirebaseServices } from './authService' 
import { getUserCollectionName } from '../types/user'
import type { UserRole } from '../types/user'


export type AccountStatus = 'activa' | 'suspendida' | 'pendiente'

export interface ManagedAccount {
  id: string
  role: UserRole
  displayName: string
  email: string
  status: AccountStatus
  lastActiveAt: Date
}

function toDate(value: unknown): Date {
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return value instanceof Date ? value : new Date()
}

async function listByRole(role: UserRole): Promise<ManagedAccount[]> {
  const { db } = getFirebaseServices()
  const collectionName = getUserCollectionName(role)
  const snapshot = await getDocs(collection(db, collectionName))

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>
    return {
      id: docSnap.id,
      role,
      displayName: (data.displayName as string) || (data.email as string) || 'Usuario',
      email: (data.email as string) || '',
      status: (data.accountStatus as AccountStatus) || 'activa',
      lastActiveAt: toDate(data.updatedAt ?? data.createdAt),
    }
  })
}

export function listUsers(): Promise<ManagedAccount[]> {
  return listByRole('consumer')
}

export function listStores(): Promise<ManagedAccount[]> {
  return listByRole('store')
}

export async function setAccountStatus(
  id: string,
  role: UserRole,
  status: AccountStatus
): Promise<void> {
  const { db } = getFirebaseServices()
  const collectionName = getUserCollectionName(role)
  await updateDoc(doc(db, collectionName, id), {
    accountStatus: status,
    updatedAt: serverTimestamp(),
  })

}

export async function deleteAccountDocument(id: string, role: UserRole): Promise<void> {
  const { db } = getFirebaseServices()
  const collectionName = getUserCollectionName(role)
  await deleteDoc(doc(db, collectionName, id))
}
