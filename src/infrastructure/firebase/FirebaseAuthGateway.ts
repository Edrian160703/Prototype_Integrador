import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import type { Auth } from 'firebase/auth'
import type {
  AuthIdentity,
  IAuthAccountDeleter,
  IAuthProfileUpdater,
  IAuthRegistrar,
  IAuthSession,
  IAuthSignIn,
  IAuthSignOut,
} from '../../ports/authGateway'

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
  IAuthAccountDeleter,
  IAuthSignOut {
  constructor(private readonly auth: Auth) {}

  get currentUser(): AuthIdentity | null {
    const user = this.auth.currentUser
    return user ? toIdentity(user) : null
  }

  onAuthStateChanged(listener: (user: AuthIdentity | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => listener(user ? toIdentity(user) : null))
  }

  async registerWithEmail(email: string, password: string, displayName: string | null): Promise<AuthIdentity> {
    const { user } = await createUserWithEmailAndPassword(this.auth, email, password)
    if (displayName) await updateProfile(user, { displayName })
    return toIdentity(user)
  }

  async signInWithEmail(email: string, password: string): Promise<AuthIdentity> {
    const { user } = await signInWithEmailAndPassword(this.auth, email, password)
    return toIdentity(user)
  }

  async signInWithGoogle(): Promise<AuthIdentity> {
    const { user } = await signInWithPopup(this.auth, new GoogleAuthProvider())
    return toIdentity(user)
  }

  async updateDisplayName(uid: string, displayName: string): Promise<void> {
    const user = this.auth.currentUser
    if (user?.uid === uid) await updateProfile(user, { displayName })
  }

  async deleteCurrentAccount(): Promise<void> {
    const user = this.auth.currentUser
    if (user) await deleteUser(user)
  }

  async signOut(): Promise<void> {
    await signOut(this.auth)
  }
}
