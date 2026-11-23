import { createVerify, X509Certificate } from 'node:crypto'
import { HttpError } from './errors'
import { isRecord } from './validation'
import type { JsonRecord } from './types'
import type { FirebaseIdentity } from './firebaseAuthenticator'

const FIREBASE_CERTIFICATES_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'

interface FirebaseCertificates {
  values: Map<string, string>
  expiresAt: number
}

let firebaseCertificates: FirebaseCertificates | undefined
let lastUnknownKeyRefreshAt = 0

function decodeJwtPart(value: string): JsonRecord {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (isRecord(parsed)) return parsed
  } catch {
    throw new HttpError(401, 'INVALID_TOKEN', 'La sesión no es válida o expiró. Inicia sesión nuevamente.')
  }
  throw new HttpError(401, 'INVALID_TOKEN', 'La sesión no es válida o expiró. Inicia sesión nuevamente.')
}

async function getFirebaseCertificates(
  fetcher: typeof fetch,
  forceRefresh = false,
): Promise<Map<string, string>> {
  if (!forceRefresh && firebaseCertificates && firebaseCertificates.expiresAt > Date.now()) {
    return firebaseCertificates.values
  }

  let response: Response
  try {
    response = await fetcher(FIREBASE_CERTIFICATES_URL, {
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    throw new HttpError(503, 'AUTH_VERIFICATION_UNAVAILABLE', 'No se pudo verificar la sesión. Intenta más tarde.')
  }
  if (!response.ok) {
    throw new HttpError(503, 'AUTH_VERIFICATION_UNAVAILABLE', 'No se pudo verificar la sesión. Intenta más tarde.')
  }

  let certificateData: unknown
  try {
    certificateData = await response.json()
  } catch {
    throw new HttpError(503, 'AUTH_VERIFICATION_UNAVAILABLE', 'No se pudo verificar la sesión. Intenta más tarde.')
  }
  if (!isRecord(certificateData)) {
    throw new HttpError(503, 'AUTH_VERIFICATION_UNAVAILABLE', 'No se pudo verificar la sesión. Intenta más tarde.')
  }
  const certificates = new Map<string, string>()
  for (const [key, certificate] of Object.entries(certificateData)) {
    if (typeof certificate !== 'string') {
      throw new HttpError(503, 'AUTH_VERIFICATION_UNAVAILABLE', 'No se pudo verificar la sesión. Intenta más tarde.')
    }
    certificates.set(key, certificate)
  }

  const cacheControl = response.headers.get('cache-control') ?? ''
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/i)?.[1] ?? 300)
  firebaseCertificates = {
    values: certificates,
    expiresAt: Date.now() + Math.max(0, maxAge) * 1000,
  }
  lastUnknownKeyRefreshAt = Date.now()
  return firebaseCertificates.values
}

export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
  fetcher: typeof fetch,
): Promise<FirebaseIdentity> {
  const parts = token.split('.')
  if (parts.length !== 3 || token.length > 8_192) {
    throw new HttpError(401, 'INVALID_TOKEN', 'La sesión no es válida o expiró. Inicia sesión nuevamente.')
  }

  const header = decodeJwtPart(parts[0])
  const claims = decodeJwtPart(parts[1])
  const nowSeconds = Math.floor(Date.now() / 1000)
  const firebase = claims.firebase
  if (
    header.alg !== 'RS256'
    || typeof header.kid !== 'string'
    || claims.aud !== projectId
    || claims.iss !== `https://securetoken.google.com/${projectId}`
    || typeof claims.sub !== 'string'
    || claims.sub.length < 1
    || claims.sub.length > 128
    || typeof claims.exp !== 'number'
    || claims.exp <= nowSeconds
    || typeof claims.iat !== 'number'
    || claims.iat > nowSeconds + 60
    || typeof claims.auth_time !== 'number'
    || claims.auth_time > nowSeconds + 60
    || !isRecord(firebase)
    || typeof firebase.sign_in_provider !== 'string'
  ) {
    throw new HttpError(401, 'INVALID_TOKEN', 'La sesión no es válida o expiró. Inicia sesión nuevamente.')
  }
  let certificates = await getFirebaseCertificates(fetcher)
  if (!certificates.has(header.kid) && Date.now() - lastUnknownKeyRefreshAt > 60_000) {
    lastUnknownKeyRefreshAt = Date.now()
    certificates = await getFirebaseCertificates(fetcher, true)
  }
  const certificate = certificates.get(header.kid)
  if (!certificate) {
    throw new HttpError(401, 'INVALID_TOKEN', 'La sesión no es válida o expiró. Inicia sesión nuevamente.')
  }

  try {
    const verifier = createVerify('RSA-SHA256')
    verifier.update(`${parts[0]}.${parts[1]}`)
    verifier.end()
    if (!verifier.verify(new X509Certificate(certificate).publicKey, Buffer.from(parts[2], 'base64url'))) {
      throw new HttpError(401, 'INVALID_TOKEN', 'La sesión no es válida o expiró. Inicia sesión nuevamente.')
    }
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(401, 'INVALID_TOKEN', 'La sesión no es válida o expiró. Inicia sesión nuevamente.')
  }

  return { uid: claims.sub, signInProvider: firebase.sign_in_provider }
}
