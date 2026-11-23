import { createGeminiController } from './controller'
import { FirebaseGeminiAuthenticator } from './firebaseAuthenticator'
import { verifyFirebaseIdToken } from './firebaseTokenVerifier'
import { GeminiDeveloperApiProvider } from './provider'
import { InMemoryGeminiRateLimiter } from './rateLimit'
import { GeminiService } from './service'
import type { FirebaseIdentity, FirebaseIdTokenVerifier } from './firebaseAuthenticator'

export interface GeminiHandlerDependencies {
  env?: Record<string, string | undefined>
  fetcher?: typeof fetch
  verifyIdToken?: (
    token: string,
    projectId: string,
    fetcher: typeof fetch,
  ) => Promise<FirebaseIdentity>
  now?: () => number
}

export function createGeminiHandler(dependencies: GeminiHandlerDependencies = {}) {
  const env = dependencies.env ?? process.env
  const fetcher = dependencies.fetcher ?? fetch
  const now = dependencies.now ?? Date.now
  const verifyOverride = dependencies.verifyIdToken
  const verifyIdToken: FirebaseIdTokenVerifier = (token, projectId) => (
    verifyOverride
      ? verifyOverride(token, projectId, fetcher)
      : verifyFirebaseIdToken(token, projectId, fetcher)
  )

  const authenticator = new FirebaseGeminiAuthenticator(env.VITE_FIREBASE_PROJECT_ID, verifyIdToken)
  const provider = new GeminiDeveloperApiProvider(fetcher, env.GEMINI_API_KEY)
  const service = new GeminiService(provider, () => new Date(now()))

  return createGeminiController({
    authenticator,
    rateLimiter: new InMemoryGeminiRateLimiter(),
    service,
    now,
  })
}

export function handleGeminiRequest(
  request: Request,
  dependencies: GeminiHandlerDependencies = {},
): Promise<Response> {
  return createGeminiHandler(dependencies)(request)
}
