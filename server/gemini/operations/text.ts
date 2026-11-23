import { HttpError } from '../errors'
import type { GeminiInput, GeminiOperationStrategy } from '../types'
import { assertAllowedKeys } from '../validation'

const MAX_TEXT_PROMPT_LENGTH = 4_000

function isTextInput(input: GeminiInput): input is Extract<GeminiInput, { operation: 'text' }> {
  return input.operation === 'text'
}

export const textOperation: GeminiOperationStrategy = {
  parseRequest(body) {
    if (body.operation !== 'text') {
      throw new HttpError(400, 'INVALID_OPERATION', 'El tipo de análisis no está permitido.')
    }
    assertAllowedKeys(body, ['operation', 'prompt'])
    if (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > MAX_TEXT_PROMPT_LENGTH) {
      throw new HttpError(400, 'INVALID_REQUEST', 'La instrucción de texto debe tener entre 1 y 4000 caracteres.')
    }
    return { operation: 'text', prompt: body.prompt }
  },

  buildProviderRequest(input) {
    if (!isTextInput(input)) throw new Error('Text strategy received an incompatible input.')
    return {
      contents: [{ role: 'user', parts: [{ text: input.prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 1_024 },
    }
  },

  parseProviderResponse(text) {
    if (!text.trim()) {
      throw new HttpError(502, 'INVALID_PROVIDER_RESPONSE', 'El servicio de análisis devolvió una respuesta vacía.')
    }
    return { text: text.trim() }
  },
}
