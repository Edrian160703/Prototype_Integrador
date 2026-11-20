import type { ObjectSchemaRequest } from 'firebase/ai'
import { getGeminiModel } from '../firebase/config'

export class GeminiApiError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'UNAUTHENTICATED'
      | 'CONNECTION'
      | 'MODEL_UNAVAILABLE'
      | 'QUOTA'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'INVALID_RESPONSE'
      | 'RATE_LIMIT'
      | 'UNKNOWN',
  ) {
    super(message)
  }
}

export function mapGeminiError(error: unknown): GeminiApiError {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error)
  const status = (error as { status?: number }).status
  if (status === 429 || text.includes('429') || text.toLowerCase().includes('quota')) {
    return new GeminiApiError('Se alcanzó el límite temporal de solicitudes. Intenta más tarde.', 'QUOTA')
  }
  if (status === 403 || text.includes('403')) {
    return new GeminiApiError('El servicio no está disponible para esta cuenta o proyecto.', 'FORBIDDEN')
  }
  if (status === 404 || text.includes('404')) {
    return new GeminiApiError('El modelo configurado no está disponible. Reintenta más tarde.', 'MODEL_UNAVAILABLE')
  }
  if (text.toLowerCase().includes('network') || text.toLowerCase().includes('fetch')) {
    return new GeminiApiError('No pudimos conectar con el servicio de análisis. Verifica tu conexión.', 'CONNECTION')
  }
  return new GeminiApiError('No pudimos completar el análisis visual. Intenta nuevamente.', 'UNKNOWN')
}

export async function generateJson(
  prompt: string,
  image: { mimeType: string; data: string },
  schema: ObjectSchemaRequest,
): Promise<unknown> {
  try {
    const model = getGeminiModel()
    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: image.mimeType, data: image.data } },
        ],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0,
      },
    })
    const text = response.response.text()
    if (!text) throw new GeminiApiError('Gemini devolvió una respuesta vacía.', 'INVALID_RESPONSE')
    return JSON.parse(text)
  } catch (error) {
    if (error instanceof GeminiApiError) throw error
    throw mapGeminiError(error)
  }
}