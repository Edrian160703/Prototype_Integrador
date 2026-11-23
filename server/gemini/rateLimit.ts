import { HttpError } from './errors'
import type { GeminiRateLimiter } from './types'

const MAX_REQUESTS_PER_MINUTE = 20
const MAX_RATE_LIMIT_ENTRIES = 10_000
const RATE_LIMIT_WINDOW_MS = 60_000
const rateLimits = new Map<string, number[]>()

export class InMemoryGeminiRateLimiter implements GeminiRateLimiter {
  assertAllowed(uid: string, now: number): void {
    if (rateLimits.size >= MAX_RATE_LIMIT_ENTRIES && !rateLimits.has(uid)) {
      for (const [rateLimitedUid, timestamps] of rateLimits) {
        if (timestamps.every((timestamp) => timestamp <= now - RATE_LIMIT_WINDOW_MS)) {
          rateLimits.delete(rateLimitedUid)
        }
      }
      if (rateLimits.size >= MAX_RATE_LIMIT_ENTRIES) {
        throw new HttpError(429, 'RATE_LIMIT', 'El servicio está ocupado. Intenta nuevamente más tarde.')
      }
    }
    const requests = (rateLimits.get(uid) ?? []).filter((timestamp) => timestamp > now - RATE_LIMIT_WINDOW_MS)
    if (requests.length >= MAX_REQUESTS_PER_MINUTE) {
      throw new HttpError(429, 'RATE_LIMIT', 'Se alcanzó el límite de solicitudes. Espera un minuto e inténtalo nuevamente.')
    }
    requests.push(now)
    rateLimits.set(uid, requests)
  }
}
