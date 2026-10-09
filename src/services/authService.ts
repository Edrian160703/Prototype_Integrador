import type {
  AuthIdentity,
  IAuthProfileUpdater,
  IAuthRegistrar,
  IAuthSession,
  IAuthSignIn,
  IAuthSignOut,
} from '../ports/authGateway'
import type {
  IProfileCreator,
  IProfileUpdater,
  UserProfileReader,
} from '../ports/userProfileRepository'
import type { InitialUserData, InitialUserProfile, UserDocument, UserRole } from '../types/user'

function getDisplayName(profile: InitialUserData['profile']): string | null {
  if (profile && 'firstName' in profile) {
    return [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null
  }
  if (profile && 'businessName' in profile) return profile.businessName ?? null
  return null
}

export async function createInitialUserDocument(
  profiles: IProfileCreator,
  user: AuthIdentity,
  data: Omit<InitialUserData, 'uid' | 'email'>,
): Promise<void> {
  await profiles.createIfMissing({ ...user, email: user.email ?? '' }, data)
}

export async function registerWithEmail(
  auth: IAuthRegistrar,
  profiles: IProfileCreator,
  email: string,
  password: string,
  role: UserRole,
  profile: InitialUserData['profile'] = {},
): Promise<AuthIdentity> {
  const user = await auth.registerWithEmail(email, password, getDisplayName(profile))
  await createInitialUserDocument(profiles, user, { role, displayName: getDisplayName(profile), profile })
  return user
}

export async function signInWithGoogle(
  auth: IAuthSignIn,
  profiles: IProfileCreator,
  role: UserRole,
  profile: InitialUserData['profile'] = {},
): Promise<AuthIdentity> {
  const user = await auth.signInWithGoogle()
  await createInitialUserDocument(profiles, user, { role, profile })
  return user
}

export function updateUserProfile(
  profiles: IProfileUpdater,
  uid: string,
  role: UserRole,
  profile: InitialUserProfile,
): Promise<void> {
  return profiles.updateOnboarding(uid, role, profile)
}

export async function saveProfileChanges(
  authSession: IAuthSession,
  authProfileUpdater: IAuthProfileUpdater,
  profiles: IProfileUpdater,
  uid: string,
  role: UserRole,
  profile: InitialUserProfile,
  displayName: string | null,
): Promise<void> {
  await profiles.saveChanges(uid, role, profile, displayName)
  if (displayName && authSession.currentUser?.uid === uid) {
    await authProfileUpdater.updateDisplayName(uid, displayName)
  }
}

export function getCurrentUser(auth: IAuthSession): AuthIdentity | null {
  return auth.currentUser
}

export function subscribeToAuthChanges(
  auth: IAuthSession,
  listener: (user: AuthIdentity | null) => void,
): () => void {
  return auth.onAuthStateChanged(listener)
}

export function signInWithEmail(auth: IAuthSignIn, email: string, password: string): Promise<AuthIdentity> {
  return auth.signInWithEmail(email, password)
}

export async function loginWithGoogle(auth: IAuthSignIn, profiles: IProfileCreator): Promise<AuthIdentity> {
  const user = await auth.signInWithGoogle()
  await createInitialUserDocument(profiles, user, { role: 'consumer' })
  return user
}

export function signOutUser(auth: IAuthSignOut): Promise<void> {
  return auth.signOut()
}

export function getUserDocument(profiles: UserProfileReader, uid: string): Promise<UserDocument | null> {
  return profiles.getById(uid)
}
