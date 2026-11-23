import { errorResponse, HttpError, jsonResponse } from './errors'
import { parseGeminiInput } from './operations/registry'
import { assertDecodableImage, parseJsonObject } from './validation'
import type { GeminiAuthenticator, GeminiRateLimiter, GeminiUseCase } from './types'

const MAX_REQUEST_BYTES = 4_400_000

interface GeminiControllerDependencies {
  authenticator: GeminiAuthenticator
  rateLimiter: GeminiRateLimiter
  service: GeminiUseCase
  now: () => number
}

export function createGeminiController(dependencies: GeminiControllerDependencies) {
  return async function handleGeminiRequest(request: Request): Promise<Response> {
    try {
      if (request.method !== 'POST') {
        throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Utiliza el método POST.')
      }
      if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        throw new HttpError(400, 'INVALID_CONTENT_TYPE', 'El contenido debe enviarse como JSON.')
      }
      const contentLength = Number(request.headers.get('content-length') ?? 0)
      if (contentLength > MAX_REQUEST_BYTES) {
        throw new HttpError(413, 'REQUEST_TOO_LARGE', 'La solicitud supera el tamaño permitido.')
      }
      const rawBody = await request.text()
      if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
        throw new HttpError(413, 'REQUEST_TOO_LARGE', 'La solicitud supera el tamaño permitido.')
      }
      const body = parseJsonObject(rawBody)
      const user = await dependencies.authenticator.authenticate(request)
      const input = parseGeminiInput(body)
      if ('image' in input) await assertDecodableImage(input.image)
      dependencies.rateLimiter.assertAllowed(user.uid, dependencies.now())
      const signal = AbortSignal.any([request.signal, AbortSignal.timeout(25_000)])
      const result = await dependencies.service.execute(input, signal)
      return jsonResponse(200, result)
    } catch (error) {
      return errorResponse(error)
    }
  }
}
