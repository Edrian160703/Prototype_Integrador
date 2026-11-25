import { handleGeminiRequest } from '../server/gemini/handler'

export { GEMINI_MODEL } from '../server/gemini/provider'
export { handleGeminiRequest } from '../server/gemini/handler'

export default function gemini(request: Request): Promise<Response> {
  return handleGeminiRequest(request)
}
