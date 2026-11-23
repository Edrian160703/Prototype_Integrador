// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { GeminiService } from '../../server/gemini/service'
import type { GeminiProvider } from '../../server/gemini/types'

describe('Gemini service provider contract', () => {
  it('uses any provider implementation and keeps text response normalization in the operation strategy', async () => {
    const generate = vi.fn<GeminiProvider['generate']>().mockResolvedValue('  Resultado  ')
    const provider: GeminiProvider = { generate }
    const service = new GeminiService(provider)
    const signal = new AbortController().signal

    await expect(service.execute(
      { operation: 'text', prompt: 'Describe el producto.' },
      signal,
    )).resolves.toEqual({ text: 'Resultado' })

    expect(generate).toHaveBeenCalledOnce()
    const [providerRequest, providerSignal] = generate.mock.calls[0]
    expect(providerRequest.contents).toEqual([
      { role: 'user', parts: [{ text: 'Describe el producto.' }] },
    ])
    expect(providerSignal).toBe(signal)
  })
})
