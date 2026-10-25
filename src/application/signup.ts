import type {
  AuthIdentity,
  IAuthAccountDeleter,
  IAuthRegistrar,
  IAuthSignIn,
  IAuthSignOut,
} from '../ports/authGateway'
import type {
  EmailSignupDraft,
  ISignupDraftReader,
  ISignupDraftWriter,
  SignupDraft,
} from '../ports/signupDraftStore'
import type { IProfileCreator } from '../ports/userProfileRepository'
import type { InitialUserProfile, UserRole } from '../types/user'
import { getDisplayName } from './auth'

const EXPIRED_SIGNUP_MESSAGE = 'Tu registro expiró. Vuelve a ingresar tus datos.'

type StartEmailSignupInput = Omit<EmailSignupDraft, 'method' | 'profile'> & {
  profile?: InitialUserProfile
}

/** Paso 1 por correo: solo recuerda los datos en memoria. No crea cuenta ni documento. */
export function startEmailSignup(drafts: ISignupDraftWriter, input: StartEmailSignupInput): void {
  drafts.save({ method: 'email', ...input, profile: input.profile ?? {} })
}

/** Paso 1 con Google: autentica la identidad, pero no escribe nada en la base de datos. */
export async function startGoogleSignup(
  auth: IAuthSignIn,
  drafts: ISignupDraftWriter,
  role: UserRole,
  profile: InitialUserProfile = {},
): Promise<AuthIdentity> {
  const identity = await auth.signInWithGoogle()
  drafts.save({ method: 'google', identity, role, profile })
  return identity
}

export function getPendingSignupRole(drafts: ISignupDraftReader): UserRole | null {
  return drafts.get()?.role ?? null
}

function resolveIdentity(draft: SignupDraft, auth: IAuthRegistrar, profile: InitialUserProfile) {
  switch (draft.method) {
    case 'email':
      return auth.registerWithEmail(draft.email, draft.password, getDisplayName(profile))
    case 'google':
      return Promise.resolve(draft.identity)
  }
}

/**
 * Paso 2: recién aquí se crea la cuenta y el documento del usuario, ya con el
 * onboarding completo. Si falla el documento se revierte la cuenta creada por correo.
 */
export async function completeSignup(
  auth: IAuthRegistrar & IAuthAccountDeleter,
  profiles: IProfileCreator,
  drafts: ISignupDraftReader & ISignupDraftWriter,
  onboardingProfile: InitialUserProfile,
): Promise<AuthIdentity> {
  const draft = drafts.get()
  if (!draft) throw new Error(EXPIRED_SIGNUP_MESSAGE)

  const profile = { ...draft.profile, ...onboardingProfile }
  const identity = await resolveIdentity(draft, auth, profile)

  try {
    await profiles.createIfMissing(
      { ...identity, email: identity.email ?? '' },
      {
        role: draft.role,
        displayName: getDisplayName(profile),
        profile,
        onboardingCompleted: true,
      },
    )
  } catch (error) {
    if (draft.method === 'email') await auth.deleteCurrentAccount().catch(() => undefined)
    throw error
  }

  drafts.clear()
  return identity
}

/** Abandona el registro; si venía de Google también cierra esa sesión a medias. */
export async function cancelSignup(
  auth: IAuthSignOut,
  drafts: ISignupDraftReader & ISignupDraftWriter,
): Promise<void> {
  const draft = drafts.get()
  drafts.clear()
  if (draft?.method === 'google') await auth.signOut()
}
