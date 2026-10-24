import { collection, doc, serverTimestamp, setDoc, updateDoc, type DocumentReference, type Firestore } from 'firebase/firestore'
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
import { createUserDocumentPolicies, type UserDocumentPolicies } from './userDocumentPolicies'

export class FirebaseUserProfileRepository implements
  UserProfileReader,
  IProfileCreator,
  IOnboardingProfileWriter,
  IProfileEditor {
  constructor(
    private readonly db: Firestore,
    private readonly policies: UserDocumentPolicies = createUserDocumentPolicies(db),
  ) {}

  async getById(uid: string): Promise<UserDocument | null> {
    for (const collectionName of USER_COLLECTION_NAMES) {
      const snapshot = await this.policies[collectionName].finder.find(collectionName, uid)
      if (snapshot?.exists()) return mapUserProfileDocument(uid, collectionName, snapshot.data())
    }
    return null
  }

  async createIfMissing(
    user: { uid: string; email: string; displayName: string | null; photoURL: string | null },
    data: Omit<InitialUserData, 'uid' | 'email'>,
  ): Promise<void> {
    const collectionName = getUserCollectionName(data.role)
    const { ids, finder } = this.policies[collectionName]

    const existingUser = await finder.find(collectionName, user.uid)
    if (existingUser) return

    const displayName = data.displayName ?? user.displayName
    const documentId = ids.createId({ uid: user.uid, displayName, profile: data.profile })

    const userData: Record<string, unknown> = {
      uid: user.uid,
      email: user.email,
      role: data.role,
      displayName,
      photoURL: data.photoURL ?? user.photoURL,
      onboardingCompleted: data.onboardingCompleted ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...data.profile,
    }
    await setDoc(doc(collection(this.db, collectionName), documentId), userData)
  }

  async updateOnboarding(uid: string, role: UserRole, profile: InitialUserProfile): Promise<void> {
    await updateDoc(await this.requireReference(uid, role), {
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
    await updateDoc(await this.requireReference(uid, role), {
      ...profile,
      displayName,
      updatedAt: serverTimestamp(),
    })
  }

  private async requireReference(uid: string, role: UserRole): Promise<DocumentReference> {
    const collectionName = getUserCollectionName(role)
    const snapshot = await this.policies[collectionName].finder.find(collectionName, uid)
    if (!snapshot) throw new Error(`No existe el perfil ${uid} en la colección "${collectionName}".`)
    return snapshot.ref
  }
}
