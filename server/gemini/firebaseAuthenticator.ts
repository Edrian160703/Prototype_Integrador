import { HttpError } from './errors'
import type { AuthenticatedUser, GeminiAuthenticator } from './types'

export interface FirebaseIdentity {
  uid: string
  signInProvider: string
}

export type FirebaseIdTokenVerifier = (
  token: string,
  projectId: string,
) => Promise<FirebaseIdentity>

export class FirebaseGeminiAuthenticator implements GeminiAuthenticator {
  constructor(
    private readonly projectId: string | undefined,
    private readonly verifyIdToken: FirebaseIdTokenVerifier,
  ) {}

  async authenticate(request: Request): Promise<AuthenticatedUser> {
    const authorization = request.headers.get('authorization') ?? ''
    const tokenMatch = /^Bearer ([^\s]+)$/.exec(authorization)
    if (!tokenMatch || tokenMatch[1].length > 8_192) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Inicia sesión para utilizar el análisis.')
    }
    if (!this.projectId) {
      throw new HttpError(500, 'SERVER_CONFIGURATION', 'El servicio de análisis no está configurado.')
    }

    let user: FirebaseIdentity
    try {
      user = await this.verifyIdToken(tokenMatch[1], this.projectId)
    } catch (error) {
      if (error instanceof HttpError) throw error
      throw new HttpError(503, 'AUTH_VERIFICATION_UNAVAILABLE', 'No se pudo verificar la sesión. Intenta más tarde.')
    }
    if (user.signInProvider === 'anonymous') {
      throw new HttpError(403, 'REGISTERED_ACCOUNT_REQUIRED', 'El análisis requiere una cuenta registrada.')
    }
    return { uid: user.uid }
  }
}
