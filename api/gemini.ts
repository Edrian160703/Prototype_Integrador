import { handleGeminiRequest } from '../server/gemini/handler'

export { GEMINI_MODEL } from '../server/gemini/provider'
export { handleGeminiRequest } from '../server/gemini/handler'

export default { fetch: handleGeminiRequest }
