import {
  getCurrentUser,
  hasAdminClaim,
  loginWithGoogle,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  subscribeToAuthChanges,
} from '../application/auth'
import type { AuthenticationApplication } from '../application/contracts'
import {
  cancelSignup,
  completeSignup,
  getPendingSignupRole,
  startEmailSignup,
  startGoogleSignup,
} from '../application/signup'
import type {
  IAuthAccountDeleter,
  IAuthAdminClaimReader,
  IAuthRegistrar,
  IAuthSession,
  IAuthSignIn,
  IAuthSignOut,
} from '../ports/authGateway'
import type { ISignupDraftReader, ISignupDraftWriter } from '../ports/signupDraftStore'
import type { IProfileCreator } from '../ports/userProfileRepository'
import type { InitialUserData, UserRole } from '../types/user'

type AuthGateway =
  & IAuthSession
  & IAuthRegistrar
  & IAuthSignIn
  & IAuthAdminClaimReader
  & IAuthSignOut
  & IAuthAccountDeleter

interface AuthenticationServiceDependencies {
  auth: AuthGateway
  profiles: () => Promise<IProfileCreator>
  signupDrafts: ISignupDraftReader & ISignupDraftWriter
}

export function createAuthenticationService({
  auth,
  profiles,
  signupDrafts,
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
    startEmailSignup: (input) => startEmailSignup(signupDrafts, input),
    startGoogleSignup: (role, profile) => startGoogleSignup(auth, signupDrafts, role, profile),
    getPendingSignupRole: () => getPendingSignupRole(signupDrafts),
    completeSignup: async (profile) => completeSignup(auth, await profiles(), signupDrafts, profile),
    cancelSignup: () => cancelSignup(auth, signupDrafts),
    signInWithEmail: (email: string, password: string) =>
      signInWithEmail(auth, email, password),
    loginWithGoogle: async () => loginWithGoogle(auth, await profiles()),
    hasAdminClaim: () => hasAdminClaim(auth),
    signOutUser: () => signOutUser(auth),
    getCurrentUser: () => getCurrentUser(auth),
    subscribeToAuthChanges: (listener) => subscribeToAuthChanges(auth, listener),
  }
}
