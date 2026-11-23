import { HttpError } from './errors'
import { isRecord } from './validation'
import type { GeminiProvider, GeminiProviderRequest } from './types'

export const GEMINI_MODEL = 'gemini-3.1-flash-lite'

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function getAbortError(signal: AbortSignal, error: unknown): HttpError | undefined {
  if (!signal.aborted || typeof error !== 'object' || error === null || !('name' in error)) {
    return undefined
  }
  if (error.name !== 'AbortError' && error.name !== 'TimeoutError') return undefined

  if (
    typeof signal.reason === 'object'
    && signal.reason !== null
    && 'name' in signal.reason
    && signal.reason.name === 'TimeoutError'
  ) {
    return new HttpError(504, 'PROVIDER_TIMEOUT', 'El servicio de análisis tardó demasiado. Intenta nuevamente.')
  }
  return new HttpError(499, 'CLIENT_ABORTED', 'El cliente canceló la solicitud.')
}

function readGeminiText(response: unknown): string {
  if (!isRecord(response) || !Array.isArray(response.candidates) || !isRecord(response.candidates[0])) {
    throw new HttpError(502, 'INVALID_PROVIDER_RESPONSE', 'El servicio de análisis devolvió una respuesta inválida.')
  }
  const content = response.candidates[0].content
  if (!isRecord(content) || !Array.isArray(content.parts)) {
    throw new HttpError(502, 'INVALID_PROVIDER_RESPONSE', 'El servicio de análisis devolvió una respuesta vacía.')
  }
  const text = content.parts
    .filter(isRecord)
    .map((part) => part.text)
    .find((part): part is string => typeof part === 'string' && part.trim().length > 0)
  if (!text) {
    throw new HttpError(502, 'INVALID_PROVIDER_RESPONSE', 'El servicio de análisis devolvió una respuesta vacía.')
  }
  return text
}

export class GeminiDeveloperApiProvider implements GeminiProvider {
  constructor(
    private readonly fetcher: typeof fetch,
    private readonly apiKey: string | undefined,
  ) {}

  async generate(body: GeminiProviderRequest, signal: AbortSignal): Promise<string> {
    if (!this.apiKey) {
      throw new HttpError(500, 'SERVER_CONFIGURATION', 'El servicio de análisis no está configurado.')
    }

    let response: Response
    try {
      response = await this.fetcher(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal,
      })
    } catch (error) {
      const abortError = getAbortError(signal, error)
      if (abortError) throw abortError
      throw new HttpError(503, 'PROVIDER_UNAVAILABLE', 'El servicio de análisis no está disponible temporalmente.')
    }

    if (response.status === 429) {
      throw new HttpError(429, 'QUOTA_EXHAUSTED', 'Se alcanzó el límite gratuito o temporal de Gemini. Intenta más tarde.')
    }
    if ([401, 403, 404].includes(response.status) || response.status >= 500) {
      throw new HttpError(503, 'PROVIDER_UNAVAILABLE', 'El servicio de análisis no está disponible temporalmente.')
    }
    if (!response.ok) {
      throw new HttpError(502, 'PROVIDER_REQUEST_FAILED', 'Gemini no pudo procesar la solicitud.')
    }

    let providerResponse: unknown
    try {
      providerResponse = await response.json()
    } catch (error) {
      const abortError = getAbortError(signal, error)
      if (abortError) throw abortError
      throw new HttpError(502, 'INVALID_PROVIDER_RESPONSE', 'El servicio de análisis devolvió una respuesta inválida.')
    }
    return readGeminiText(providerResponse)
  }
}
