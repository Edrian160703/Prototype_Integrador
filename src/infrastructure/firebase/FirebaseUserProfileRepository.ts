import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import type { IProfileCreator, IProfileUpdater, UserProfileReader } from '../../ports/userProfileRepository'
import type {
  InitialUserData,
  InitialUserProfile,
  UserDocument,
  UserRole,
} from '../../types/user'
import { getFirebaseServices } from './firebaseClient'
import { toDate } from './firestoreDates'
import { getUserCollectionName, USER_COLLECTION_NAMES } from './userCollections'

function toUserDocument(uid: string, data: Record<string, unknown>): UserDocument {
  const common = {
    ...data,
    uid,
    email: typeof data.email === 'string' ? data.email : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : null,
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    onboardingCompleted: data.onboardingCompleted === true,
  }
  if (data.role === 'consumer') return common as UserDocument
  if (data.role === 'store') return common as UserDocument
  throw new TypeError(`Rol de usuario no válido para el perfil ${uid}.`)
}

export class FirebaseUserProfileRepository implements UserProfileReader, IProfileCreator, IProfileUpdater {
  async getById(uid: string): Promise<UserDocument | null> {
    const { db } = getFirebaseServices()
    for (const collectionName of USER_COLLECTION_NAMES) {
      const snapshot = await getDoc(doc(collection(db, collectionName), uid))
      if (snapshot.exists()) return toUserDocument(uid, snapshot.data())
    }
    return null
  }

  async createIfMissing(
    user: { uid: string; email: string; displayName: string | null; photoURL: string | null },
    data: Omit<InitialUserData, 'uid' | 'email'>,
  ): Promise<void> {
    const { db } = getFirebaseServices()
    const userReference = doc(collection(db, getUserCollectionName(data.role)), user.uid)
    const existingUser = await getDoc(userReference)
    if (existingUser.exists()) return

    const userData: Record<string, unknown> = {
      uid: user.uid,
      email: user.email,
      role: data.role,
      displayName: data.displayName ?? user.displayName,
      photoURL: data.photoURL ?? user.photoURL,
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...data.profile,
    }
    await setDoc(userReference, userData)
  }

  async updateOnboarding(uid: string, role: UserRole, profile: InitialUserProfile): Promise<void> {
    const { db } = getFirebaseServices()
    await updateDoc(doc(collection(db, getUserCollectionName(role)), uid), {
      ...profile,
      onboardingCompleted: true,
      updatedAt: serverTimestamp(),
    })
  }

  async saveChanges(
    uid: string,
    role: UserRole,
    profile: InitialUserProfile,
    displayName: string | null,
  ): Promise<void> {
    const { db } = getFirebaseServices()
    await updateDoc(doc(collection(db, getUserCollectionName(role)), uid), {
      ...profile,
      displayName,
      updatedAt: serverTimestamp(),
    })
  }
}
