import type { JsonRecord } from './types'

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function jsonResponse(status: number, body: JsonRecord): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse(error.status, {
      error: { code: error.code, message: error.message },
    })
  }
  return jsonResponse(500, {
    error: { code: 'INTERNAL_ERROR', message: 'No se pudo completar el análisis.' },
  })
}
