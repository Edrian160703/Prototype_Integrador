import { VALIDAR_ALIMENTO_PROMPT } from '../../../src/GeminiApi/prompts/validarAlimento.prompt'
import { alimentoSchema } from '../../../src/GeminiApi/schrema/alimento.schema'
import { parseResultadoAlimento } from '../../../src/GeminiApi/services/validarAlimento'
import { HttpError } from '../errors'
import type { GeminiInput, GeminiOperationStrategy } from '../types'
import { assertAllowedKeys, isValidFoodResult, parseProviderJson, readImage } from '../validation'

function isFoodInput(input: GeminiInput): input is Extract<GeminiInput, { operation: 'validateFood' }> {
  return input.operation === 'validateFood'
}

export const validateFoodOperation: GeminiOperationStrategy = {
  parseRequest(body) {
    if (body.operation !== 'validateFood') {
      throw new HttpError(400, 'INVALID_OPERATION', 'El tipo de análisis no está permitido.')
    }
    assertAllowedKeys(body, ['operation', 'image'])
    return { operation: 'validateFood', image: readImage(body.image) }
  },

  buildProviderRequest(input) {
    if (!isFoodInput(input)) throw new Error('Food validation strategy received an incompatible input.')
    return {
      contents: [{
        role: 'user',
        parts: [
          { text: VALIDAR_ALIMENTO_PROMPT },
          { inlineData: { mimeType: input.image.mimeType, data: input.image.data } },
        ],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: alimentoSchema,
        temperature: 0,
        maxOutputTokens: 1_024,
      },
    }
  },

  parseProviderResponse(text) {
    const result = parseProviderJson(text)
    if (!isValidFoodResult(result)) {
      throw new HttpError(502, 'INVALID_PROVIDER_RESPONSE', 'Gemini devolvió datos que no cumplen el formato esperado.')
    }
    return { result: { ...parseResultadoAlimento(result) } }
  },
}
