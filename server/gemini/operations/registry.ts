import { HttpError } from '../errors'
import type {
  GeminiInput,
  GeminiOperation,
  GeminiOperationStrategy,
  GeminiProviderRequest,
  GeminiResponse,
  JsonRecord,
} from '../types'
import { analyzeExpirationOperation } from './analyzeExpiration'
import { textOperation } from './text'
import { validateFoodOperation } from './validateFood'

const strategies: Record<GeminiOperation, GeminiOperationStrategy> = {
  text: textOperation,
  validateFood: validateFoodOperation,
  analyzeExpiration: analyzeExpirationOperation,
}

function isGeminiOperation(value: unknown): value is GeminiOperation {
  return typeof value === 'string' && Object.hasOwn(strategies, value)
}

export function parseGeminiInput(body: JsonRecord): GeminiInput {
  if (!isGeminiOperation(body.operation)) {
    throw new HttpError(400, 'INVALID_OPERATION', 'El tipo de análisis no está permitido.')
  }
  return strategies[body.operation].parseRequest(body)
}

export function buildProviderRequest(input: GeminiInput): GeminiProviderRequest {
  return strategies[input.operation].buildProviderRequest(input)
}

export function parseProviderResponse(input: GeminiInput, text: string, now?: Date): GeminiResponse {
  return strategies[input.operation].parseProviderResponse(text, now)
}
