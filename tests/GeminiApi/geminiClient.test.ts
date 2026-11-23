import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GeminiApiClient, GeminiApiError } from '../../src/GeminiApi/services/geminiClient'

describe('Gemini HTTP client', () => {
  const getIdToken = vi.fn<() => Promise<string | null>>()

  beforeEach(() => {
    vi.clearAllMocks()
    getIdToken.mockResolvedValue('signed-firebase-token')
  })

  it('sends authenticated text requests to the local API route', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ text: 'Descripción generada.' }),
    )
    const client = new GeminiApiClient({ getIdToken }, fetchMock)

    await expect(client.generateText('Describe un producto.')).resolves.toBe('Descripción generada.')
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/gemini')
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer signed-firebase-token')
    expect(JSON.parse(String(init?.body))).toEqual({
      operation: 'text',
      prompt: 'Describe un producto.',
    })
  })

  it('does not send requests without an authentication token', async () => {
    getIdToken.mockResolvedValue(null)
    const fetchMock = vi.fn<typeof fetch>()
    const client = new GeminiApiClient({ getIdToken }, fetchMock)

    await expect(client.generateText('Describe un producto.')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('surfaces free-tier quota responses as a stop condition', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        { error: { code: 'QUOTA_EXHAUSTED', message: 'Se alcanzó el límite gratuito.' } },
        { status: 429 },
      ),
    )
    const client = new GeminiApiClient({ getIdToken }, fetchMock)

    await expect(client.generateText('Describe un producto.')).rejects.toMatchObject({
      code: 'QUOTA',
    })
  })

  it('validates structured responses returned by the endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({}))
    const client = new GeminiApiClient({ getIdToken }, fetchMock)

    await expect(client.generateJson('validateFood', {
      mimeType: 'image/jpeg',
      data: 'Zm9vZA==',
    })).rejects.toBeInstanceOf(GeminiApiError)
  })
})
