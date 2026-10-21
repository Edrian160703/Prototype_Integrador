import {
  getCurrentUser,
  getUserDocument,
  loginWithGoogle,
  registerWithEmail,
  saveProfileChanges,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  subscribeToAuthChanges,
  updateUserProfile,
} from '../application/auth'
import type {
  AuthenticationApplication,
  UserProfileApplication,
} from '../application/contracts'
import type {
  IAuthProfileUpdater,
  IAuthRegistrar,
  IAuthSession,
  IAuthSignIn,
  IAuthSignOut,
} from '../ports/authGateway'
import type {
  IOnboardingProfileWriter,
  IProfileCreator,
  IProfileEditor,
  UserProfileReader,
} from '../ports/userProfileRepository'
import type { InitialUserData, InitialUserProfile, UserRole } from '../types/user'

type AuthGateway =
  & IAuthSession
  & IAuthRegistrar
  & IAuthSignIn
  & IAuthProfileUpdater
  & IAuthSignOut

type ProfileRepository =
  & UserProfileReader
  & IProfileCreator
  & IOnboardingProfileWriter
  & IProfileEditor

interface IdentityServiceDependencies {
  auth: AuthGateway
  profiles: () => Promise<ProfileRepository>
}

export interface IdentityServices {
  authentication: AuthenticationApplication
  userProfiles: UserProfileApplication
}

export function createIdentityServices({
  auth,
  profiles,
}: IdentityServiceDependencies): IdentityServices {
  return {
    authentication: {
      registerWithEmail: async (
        email: string,
        password: string,
        role: UserRole,
        profile: InitialUserData['profile'] = {},
      ) => registerWithEmail(auth, await profiles(), email, password, role, profile),
      signInWithGoogle: async (
        role: UserRole,
        profile: InitialUserData['profile'] = {},
      ) => signInWithGoogle(auth, await profiles(), role, profile),
      signInWithEmail: (email: string, password: string) =>
        signInWithEmail(auth, email, password),
      loginWithGoogle: async () => loginWithGoogle(auth, await profiles()),
      signOutUser: () => signOutUser(auth),
      getCurrentUser: () => getCurrentUser(auth),
      subscribeToAuthChanges: (listener) => subscribeToAuthChanges(auth, listener),
    },
    userProfiles: {
      getUserDocument: async (uid) => getUserDocument(await profiles(), uid),
      updateUserProfile: async (
        uid: string,
        role: UserRole,
        profile: InitialUserProfile,
      ) => updateUserProfile(await profiles(), uid, role, profile),
      saveProfileChanges: async (
        uid: string,
        role: UserRole,
        profile: InitialUserProfile,
        displayName: string | null,
      ) => saveProfileChanges(auth, auth, await profiles(), uid, role, profile, displayName),
    },
  }
}
