import type { InitialUserProfile, UserRole } from '../types/user'
import type { AuthIdentity } from './authGateway'

interface BaseSignupDraft {
  role: UserRole
  profile: InitialUserProfile
}

/** Datos del paso 1 por correo. Todavía no existe cuenta ni documento. */
export interface EmailSignupDraft extends BaseSignupDraft {
  method: 'email'
  email: string
  password: string
}

/** Identidad ya autenticada con Google, pendiente de completar el paso 2. */
export interface GoogleSignupDraft extends BaseSignupDraft {
  method: 'google'
  identity: AuthIdentity
}

export type SignupDraft = EmailSignupDraft | GoogleSignupDraft

export interface ISignupDraftReader {
  get(): SignupDraft | null
}

export interface ISignupDraftWriter {
  save(draft: SignupDraft): void
  clear(): void
}
