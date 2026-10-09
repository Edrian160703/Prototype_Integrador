import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import type {
  AuthIdentity,
  IAuthProfileUpdater,
  IAuthRegistrar,
  IAuthSession,
  IAuthSignIn,
  IAuthSignOut,
} from '../../ports/authGateway'
import { getFirebaseServices } from './firebaseClient'

function toIdentity(user: User): AuthIdentity {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  }
}

export class FirebaseAuthGateway implements
  IAuthSession,
  IAuthRegistrar,
  IAuthSignIn,
  IAuthProfileUpdater,
  IAuthSignOut {
  get currentUser(): AuthIdentity | null {
    const user = getFirebaseServices().auth.currentUser
    return user ? toIdentity(user) : null
  }

  onAuthStateChanged(listener: (user: AuthIdentity | null) => void): () => void {
    return onAuthStateChanged(getFirebaseServices().auth, (user) => listener(user ? toIdentity(user) : null))
  }

  async registerWithEmail(email: string, password: string, displayName: string | null): Promise<AuthIdentity> {
    const { auth } = getFirebaseServices()
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) await updateProfile(user, { displayName })
    return toIdentity(user)
  }

  async signInWithEmail(email: string, password: string): Promise<AuthIdentity> {
    const { user } = await signInWithEmailAndPassword(getFirebaseServices().auth, email, password)
    return toIdentity(user)
  }

  async signInWithGoogle(): Promise<AuthIdentity> {
    const { user } = await signInWithPopup(getFirebaseServices().auth, new GoogleAuthProvider())
    return toIdentity(user)
  }

  async updateDisplayName(uid: string, displayName: string): Promise<void> {
    const user = getFirebaseServices().auth.currentUser
    if (user?.uid === uid) await updateProfile(user, { displayName })
  }

  async signOut(): Promise<void> {
    await signOut(getFirebaseServices().auth)
  }
}
