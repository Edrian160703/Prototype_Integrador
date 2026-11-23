// @vitest-environment node
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { GeminiDeveloperApiProvider } from '../../server/gemini/provider'
import { assertDecodableImage, readImage } from '../../server/gemini/validation'
import { HttpError } from '../../server/gemini/errors'

const providerRequest = {
  contents: [{ role: 'user' as const, parts: [{ text: 'test' }] }],
  generationConfig: { temperature: 0, maxOutputTokens: 100 },
}

let validPng: Buffer
let validJpeg: Buffer
let validWebp: Buffer

beforeAll(async () => {
  const raw = Buffer.from([255, 0, 0, 255])
  const createImage = () => sharp(raw, { raw: { width: 1, height: 1, channels: 4 } })
  validPng = await createImage().png().toBuffer()
  validJpeg = await createImage().jpeg().toBuffer()
  validWebp = await createImage().webp().toBuffer()
})

async function validateImage(mimeType: string, bytes: Buffer): Promise<void> {
  await assertDecodableImage(readImage({ mimeType, data: bytes.toString('base64') }))
}

describe('Gemini server hardening', () => {
  it('rejects image bytes that do not match the declared MIME type', () => {
    const fakePng = Buffer.alloc(32, 0x41).toString('base64')
    try {
      readImage({ mimeType: 'image/png', data: fakePng })
      throw new Error('Expected readImage to reject mismatched image bytes')
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError)
      expect(error).toMatchObject({ status: 400, code: 'INVALID_IMAGE' })
    }
  })

  it('accepts actual PNG and WebP signatures', () => {
    const png = Buffer.alloc(32)
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

    expect(readImage({ mimeType: 'image/png', data: png.toString('base64') }).mimeType).toBe('image/png')

    const webp = Buffer.alloc(32)
    webp.write('RIFF', 0, 'ascii')
    webp.write('WEBP', 8, 'ascii')
    expect(readImage({ mimeType: 'image/webp', data: webp.toString('base64') }).mimeType).toBe('image/webp')
  })

  it('maps an aborted provider request to a timeout response', async () => {
    const controller = new AbortController()
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => {
      controller.abort(new DOMException('Timed out', 'TimeoutError'))
      throw new DOMException('aborted', 'AbortError')
    })
    const provider = new GeminiDeveloperApiProvider(fetcher, 'test-server-key')
    const signal = controller.signal

    await expect(provider.generate(providerRequest, signal)).rejects.toMatchObject({
      status: 504,
      code: 'PROVIDER_TIMEOUT',
    })
  })

  it('accepts a valid, decodable PNG', async () => {
    await expect(validateImage('image/png', validPng)).resolves.toBeUndefined()
  })

  it('accepts a valid, decodable JPEG', async () => {
    await expect(validateImage('image/jpeg', validJpeg)).resolves.toBeUndefined()
  })

  it('accepts a valid, decodable WEBP', async () => {
    await expect(validateImage('image/webp', validWebp)).resolves.toBeUndefined()
  })

  it('rejects arbitrary image bytes', async () => {
    await expect(validateImage('image/png', randomBytes(64))).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_IMAGE',
    })
  })

  it('does not expose decoder details for malformed image data', async () => {
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const pngEnd = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82])
    const malformedPng = Buffer.concat([pngSignature, randomBytes(64), pngEnd])

    await expect(validateImage('image/png', malformedPng)).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_IMAGE',
      message: 'La imagen está dañada o no se puede decodificar.',
    })
  })

  it('rejects an empty image', async () => {
    await expect(validateImage('image/png', Buffer.alloc(0))).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_IMAGE',
    })
  })

  it('rejects image data shorter than 32 bytes', async () => {
    await expect(validateImage('image/png', Buffer.alloc(31, 0x41))).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_IMAGE',
    })
  })

  it('rejects a valid PNG signature with truncated image content', async () => {
    await expect(validateImage('image/png', validPng.subarray(0, validPng.length - 10))).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_IMAGE',
    })
  })

  it('rejects a declared MIME type that differs from the decoded format', async () => {
    await expect(validateImage('image/jpeg', validPng)).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_IMAGE',
    })
  })

  it('rejects unsupported image content even when declared as PNG', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
    await expect(validateImage('image/png', svg)).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_IMAGE',
    })
  })

  it('rejects images exceeding the existing 3 MB limit', async () => {
    await expect(validateImage('image/jpeg', Buffer.alloc(3 * 1024 * 1024 + 1))).rejects.toMatchObject({
      status: 413,
      code: 'IMAGE_TOO_LARGE',
    })
  })

  it('classifies timeout while reading the provider response body as a timeout', async () => {
    const controller = new AbortController()
    const response = new Response('{}')
    vi.spyOn(response, 'json').mockImplementation(async () => {
      controller.abort(new DOMException('Timed out', 'TimeoutError'))
      throw new DOMException('aborted', 'AbortError')
    })
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response)
    const provider = new GeminiDeveloperApiProvider(fetcher, 'test-server-key')

    await expect(provider.generate(providerRequest, controller.signal)).rejects.toMatchObject({
      status: 504,
      code: 'PROVIDER_TIMEOUT',
    })
  })

  it('does not classify a client cancellation as a provider timeout', async () => {
    const controller = new AbortController()
    controller.abort()
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(controller.signal.reason)
    const provider = new GeminiDeveloperApiProvider(fetcher, 'test-server-key')

    await expect(provider.generate(providerRequest, controller.signal)).rejects.toMatchObject({
      status: 499,
      code: 'CLIENT_ABORTED',
    })
  })

  it.each([
    { status: 429, expectedStatus: 429, expectedCode: 'QUOTA_EXHAUSTED' },
    { status: 500, expectedStatus: 503, expectedCode: 'PROVIDER_UNAVAILABLE' },
  ])('preserves provider HTTP $status classification', async ({ status, expectedStatus, expectedCode }) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status }))
    const provider = new GeminiDeveloperApiProvider(fetcher, 'test-server-key')

    await expect(provider.generate(providerRequest, new AbortController().signal)).rejects.toMatchObject({
      status: expectedStatus,
      code: expectedCode,
    })
  })

  it('normalizes malformed provider JSON', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{ invalid'))
    const provider = new GeminiDeveloperApiProvider(fetcher, 'test-server-key')

    await expect(provider.generate(providerRequest, new AbortController().signal)).rejects.toMatchObject({
      status: 502,
      code: 'INVALID_PROVIDER_RESPONSE',
    })
  })

  it('normalizes an empty provider response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null))
    const provider = new GeminiDeveloperApiProvider(fetcher, 'test-server-key')

    await expect(provider.generate(providerRequest, new AbortController().signal)).rejects.toMatchObject({
      status: 502,
      code: 'INVALID_PROVIDER_RESPONSE',
    })
  })
})
