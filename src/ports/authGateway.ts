export interface AuthIdentity {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export interface IAuthSession {
  readonly currentUser: AuthIdentity | null
  onAuthStateChanged(listener: (user: AuthIdentity | null) => void): () => void
}

export interface IAuthRegistrar {
  registerWithEmail(email: string, password: string, displayName: string | null): Promise<AuthIdentity>
}

export interface IAuthSignIn {
  signInWithEmail(email: string, password: string): Promise<AuthIdentity>
  signInWithGoogle(): Promise<AuthIdentity>
}

export interface IAuthAdminClaimReader {
  hasAdminClaim(forceRefresh?: boolean): Promise<boolean>
}

export interface IAuthProfileUpdater {
  updateDisplayName(uid: string, displayName: string): Promise<void>
}

export interface IAuthAccountDeleter {
  deleteCurrentAccount(): Promise<void>
}

export interface IAuthSignOut {
  signOut(): Promise<void>
}
