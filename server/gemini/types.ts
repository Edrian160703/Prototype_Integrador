export type JsonRecord = Record<string, unknown>

export type GeminiInput =
  | { operation: 'text'; prompt: string }
  | { operation: 'validateFood'; image: { mimeType: string; data: string } }
  | { operation: 'analyzeExpiration'; image: { mimeType: string; data: string } }

export type GeminiOperation = GeminiInput['operation']

export interface AuthenticatedUser {
  uid: string
}

export interface GeminiAuthenticator {
  authenticate(request: Request): Promise<AuthenticatedUser>
}

export interface GeminiRateLimiter {
  assertAllowed(uid: string, now: number): void
}

export type GeminiProviderPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }

export interface GeminiProviderRequest {
  contents: Array<{ role: 'user'; parts: GeminiProviderPart[] }>
  generationConfig: {
    temperature: number
    maxOutputTokens: number
    responseMimeType?: 'application/json'
    responseSchema?: object
  }
}

export interface GeminiProvider {
  generate(request: GeminiProviderRequest, signal: AbortSignal): Promise<string>
}

export interface GeminiOperationStrategy {
  parseRequest(body: JsonRecord): GeminiInput
  buildProviderRequest(input: GeminiInput): GeminiProviderRequest
  parseProviderResponse(text: string, now?: Date): GeminiResponse
}

export type GeminiResponse = { text: string } | { result: JsonRecord }

export interface GeminiUseCase {
  execute(input: GeminiInput, signal: AbortSignal): Promise<GeminiResponse>
}
