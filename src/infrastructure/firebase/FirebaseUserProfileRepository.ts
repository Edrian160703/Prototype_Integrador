import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc, type Firestore } from 'firebase/firestore'
import type {
  IOnboardingProfileWriter,
  IProfileCreator,
  IProfileEditor,
  UserProfileReader,
} from '../../ports/userProfileRepository'
import type {
  InitialUserData,
  InitialUserProfile,
  UserDocument,
  UserRole,
} from '../../types/user'
import { getUserCollectionName, USER_COLLECTION_NAMES } from './userCollections'
import { mapUserProfileDocument } from './mapUserProfileDocument'

export class FirebaseUserProfileRepository implements
  UserProfileReader,
  IProfileCreator,
  IOnboardingProfileWriter,
  IProfileEditor {
  constructor(private readonly db: Firestore) {}

  async getById(uid: string): Promise<UserDocument | null> {
    for (const collectionName of USER_COLLECTION_NAMES) {
      const snapshot = await getDoc(doc(collection(this.db, collectionName), uid))
      if (snapshot.exists()) return mapUserProfileDocument(uid, collectionName, snapshot.data())
    }
    return null
  }

  async createIfMissing(
    user: { uid: string; email: string; displayName: string | null; photoURL: string | null },
    data: Omit<InitialUserData, 'uid' | 'email'>,
  ): Promise<void> {
    const userReference = doc(collection(this.db, getUserCollectionName(data.role)), user.uid)
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
    await updateDoc(doc(collection(this.db, getUserCollectionName(role)), uid), {
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
    await updateDoc(doc(collection(this.db, getUserCollectionName(role)), uid), {
      ...profile,
      displayName,
      updatedAt: serverTimestamp(),
    })
  }
}
