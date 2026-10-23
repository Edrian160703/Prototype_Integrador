import {
  getCurrentUser,
  loginWithGoogle,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  subscribeToAuthChanges,
} from '../application/auth'
import type { AuthenticationApplication } from '../application/contracts'
import type {
  IAuthRegistrar,
  IAuthSession,
  IAuthSignIn,
  IAuthSignOut,
} from '../ports/authGateway'
import type { IProfileCreator } from '../ports/userProfileRepository'
import type { InitialUserData, UserRole } from '../types/user'

type AuthGateway = IAuthSession & IAuthRegistrar & IAuthSignIn & IAuthSignOut

interface AuthenticationServiceDependencies {
  auth: AuthGateway
  profiles: () => Promise<IProfileCreator>
}

export function createAuthenticationService({
  auth,
  profiles,
}: AuthenticationServiceDependencies): AuthenticationApplication {
  return {
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
  }
}
