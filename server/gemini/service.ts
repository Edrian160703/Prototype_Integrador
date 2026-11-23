import { buildProviderRequest, parseProviderResponse } from './operations/registry'
import type { GeminiInput, GeminiProvider, GeminiResponse, GeminiUseCase } from './types'

export class GeminiService implements GeminiUseCase {
  constructor(
    private readonly provider: GeminiProvider,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(input: GeminiInput, signal: AbortSignal): Promise<GeminiResponse> {
    const request = buildProviderRequest(input)
    const text = await this.provider.generate(request, signal)
    return parseProviderResponse(input, text, this.clock())
  }
}
