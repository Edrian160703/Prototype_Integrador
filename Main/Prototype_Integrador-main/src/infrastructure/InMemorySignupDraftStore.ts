import type {
  ISignupDraftReader,
  ISignupDraftWriter,
  SignupDraft,
} from '../ports/signupDraftStore'

/**
 * Guarda el borrador solo en memoria: la contraseña nunca se escribe en
 * localStorage, sessionStorage ni en la base de datos.
 */
export class InMemorySignupDraftStore implements ISignupDraftReader, ISignupDraftWriter {
  private draft: SignupDraft | null = null

  get(): SignupDraft | null {
    return this.draft
  }

  save(draft: SignupDraft): void {
    this.draft = draft
  }

  clear(): void {
    this.draft = null
  }
}
