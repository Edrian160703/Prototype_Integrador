// @vitest-environment node
import sharp from 'sharp'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { GEMINI_MODEL, handleGeminiRequest } from '../../api/gemini'
import { parseResultadoVencimiento } from '../../src/GeminiApi/services/analizarVencimiento'

let imageFixtures: { jpeg: string; png: string; webp: string }

beforeAll(async () => {
  const raw = Buffer.from([255, 0, 0, 255])
  const createImage = () => sharp(raw, { raw: { width: 1, height: 1, channels: 4 } })
  imageFixtures = {
    jpeg: (await createImage().jpeg().toBuffer()).toString('base64'),
    png: (await createImage().png().toBuffer()).toString('base64'),
    webp: (await createImage().webp().toBuffer()).toString('base64'),
  }
})

const foodResult = {
  esAlimento: true,
  nombre: 'Pan',
  categoria: 'Panadería',
  descripcion: 'Pan visible en la fotografía.',
  caracteristicasVisuales: ['superficie dorada'],
  nivelConfianza: 92,
  motivo: 'Se identifica un alimento.',
  estadoRevision: 'aprobado',
}

const expirationResult = {
  nombreProducto: 'Leche',
  fechaFabricacion: null,
  fechaVencimiento: '2027-03-15',
  numeroLote: 'A15',
  textoDetectado: 'VENCE 15/03/2027',
  legibilidad: 'legible',
  nivelConfianza: 95,
  requiereRevision: false,
  motivoRevision: '',
  estadoRevision: 'aprobado',
  vencido: false,
}

function request(body: unknown, authorization = 'Bearer valid-test-token'): Request {
  return new Request('https://foodback.test/api/gemini', {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

function dependencies(
  fetcher: typeof fetch,
  options: { uid?: string; signInProvider?: string; now?: () => number } = {},
) {
  return {
    env: {
      GEMINI_API_KEY: 'test-server-key',
      VITE_FIREBASE_PROJECT_ID: 'foodback-test',
    },
    fetcher,
    verifyIdToken: async () => ({
      uid: options.uid ?? crypto.randomUUID(),
      signInProvider: options.signInProvider ?? 'password',
    }),
    now: options.now,
  }
}

function geminiResponse(value: unknown): Response {
  return Response.json({
    candidates: [{ content: { parts: [{ text: typeof value === 'string' ? value : JSON.stringify(value) }] } }],
  })
}

describe('Vercel Gemini endpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects missing and malformed Firebase ID tokens', async () => {
    const fetcher = vi.fn<typeof fetch>()

    const missing = await handleGeminiRequest(
      request({ operation: 'text', prompt: 'Resume esto' }, ''),
      dependencies(fetcher),
    )
    expect(missing.status).toBe(401)

    const malformed = await handleGeminiRequest(
      request({ operation: 'text', prompt: 'Resume esto' }, 'Bearer invalid'),
      { env: { VITE_FIREBASE_PROJECT_ID: 'foodback-test' }, fetcher },
    )
    expect(malformed.status).toBe(401)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('denies Firebase anonymous accounts', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const response = await handleGeminiRequest(
      request({ operation: 'text', prompt: 'Resume esto' }),
      dependencies(fetcher, { signInProvider: 'anonymous' }),
    )

    expect(response.status).toBe(403)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('uses the fixed model to fulfill text requests without returning the server key', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse('Texto generado'))
    const response = await handleGeminiRequest(
      request({ operation: 'text', prompt: 'Escribe una descripción.' }),
      dependencies(fetcher),
    )
    const responseText = await response.text()
    const [url, init] = fetcher.mock.calls[0]

    expect(response.status).toBe(200)
    expect(responseText).toBe(JSON.stringify({ text: 'Texto generado' }))
    expect(String(url)).toContain(`/models/${GEMINI_MODEL}:generateContent`)
    expect(String(url)).not.toContain('test-server-key')
    expect(new Headers(init?.headers).get('x-goog-api-key')).toBe('test-server-key')
    expect(responseText).not.toContain('test-server-key')
  })

  it('analyzes food images with server-controlled prompts and schema', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse(foodResult))
    const response = await handleGeminiRequest(
      request({
        operation: 'validateFood',
        image: { mimeType: 'image/jpeg', data: imageFixtures.jpeg },
      }),
      dependencies(fetcher),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ result: foodResult })
    const init = fetcher.mock.calls[0][1]
    const body = JSON.parse(String(init?.body))
    expect(body.generationConfig.responseSchema.type).toBe('OBJECT')
    expect(body.contents[0].parts[0].text).toContain('fotografía')
  })

  it.each([
    {
      name: 'confirmed non-food remains rejected',
      response: { ...foodResult, esAlimento: false, estadoRevision: 'rechazado' },
      expected: { esAlimento: false, estadoRevision: 'rechazado' },
    },
    {
      name: 'uncertain food remains in manual review',
      response: {
        ...foodResult,
        esAlimento: false,
        nivelConfianza: 30,
        motivo: 'La imagen es ilegible y no permite identificar el contenido.',
        estadoRevision: 'requiere_revision',
      },
      expected: { esAlimento: false, estadoRevision: 'requiere_revision' },
    },
    {
      name: 'contradictory apparent approval is downgraded to review',
      response: { ...foodResult, esAlimento: false, estadoRevision: 'aprobado' },
      expected: { esAlimento: false, estadoRevision: 'requiere_revision' },
    },
    {
      name: 'does not require Gemini to invent a commercial name',
      response: { ...foodResult, nombre: '', estadoRevision: 'aprobado' },
      expected: { esAlimento: true, estadoRevision: 'aprobado' },
    },
    {
      name: 'low-confidence rejection of non-food requires review',
      response: { ...foodResult, esAlimento: false, nivelConfianza: 59, estadoRevision: 'rechazado' },
      expected: { esAlimento: false, estadoRevision: 'requiere_revision' },
    },
  ])('normalizes food semantics on the server: $name', async ({ response: result, expected }) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse(result))
    const response = await handleGeminiRequest(
      request({
        operation: 'validateFood',
        image: { mimeType: 'image/jpeg', data: imageFixtures.jpeg },
      }),
      dependencies(fetcher),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ result: expected })
  })

  it('rejects invalid images and unsupported operations before contacting Gemini', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const badImage = await handleGeminiRequest(
      request({ operation: 'validateFood', image: { mimeType: 'image/gif', data: 'R0lGODlh' } }),
      dependencies(fetcher),
    )
    const badOperation = await handleGeminiRequest(
      request({ operation: 'callModel', model: 'other-model' }),
      dependencies(fetcher),
    )
    const malformedImage = await handleGeminiRequest(
      request({ operation: 'validateFood', image: { mimeType: 'image/jpeg', data: 'not-base64' } }),
      dependencies(fetcher),
    )

    expect(badImage.status).toBe(400)
    expect(badOperation.status).toBe(400)
    expect(malformedImage.status).toBe(400)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('rejects images exceeding the Vercel-safe size limit', async () => {
    const data = Buffer.alloc(3 * 1024 * 1024 + 1).toString('base64')
    const fetcher = vi.fn<typeof fetch>()
    const response = await handleGeminiRequest(
      request({ operation: 'validateFood', image: { mimeType: 'image/jpeg', data } }),
      dependencies(fetcher),
    )

    expect(response.status).toBe(413)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('returns normalized expiration analysis and sends invalid dates to manual review', async () => {
    const fixedNow = Date.parse('2026-11-20T05:00:00.000Z')
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse(expirationResult))
    const response = await handleGeminiRequest(
      request({
        operation: 'analyzeExpiration',
        image: { mimeType: 'image/webp', data: imageFixtures.webp },
      }),
      dependencies(fetcher, { now: () => fixedNow }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      result: { ...expirationResult, fechaEvaluacion: '2026-11-20' },
    })

    const invalidDateFetcher = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse({
      ...expirationResult,
      fechaVencimiento: '2027-02-29',
    }))
    const invalidDateResponse = await handleGeminiRequest(
      request({
        operation: 'analyzeExpiration',
        image: { mimeType: 'image/jpeg', data: imageFixtures.jpeg },
      }),
      dependencies(invalidDateFetcher, { now: () => fixedNow }),
    )
    expect(invalidDateResponse.status).toBe(200)
    await expect(invalidDateResponse.json()).resolves.toMatchObject({
      result: {
        fechaVencimiento: null,
        requiereRevision: true,
        estadoRevision: 'requiere_revision',
        vencido: false,
      },
    })

    const incompleteDateFetcher = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse({
      ...expirationResult,
      fechaVencimiento: '2027-02',
    }))
    const incompleteDateResponse = await handleGeminiRequest(
      request({
        operation: 'analyzeExpiration',
        image: { mimeType: 'image/jpeg', data: imageFixtures.jpeg },
      }),
      dependencies(incompleteDateFetcher, { now: () => fixedNow }),
    )
    expect(incompleteDateResponse.status).toBe(200)
    await expect(incompleteDateResponse.json()).resolves.toMatchObject({
      result: {
        fechaVencimiento: null,
        requiereRevision: true,
        estadoRevision: 'requiere_revision',
      },
    })

    const unreadableResult = {
      ...expirationResult,
      fechaVencimiento: null,
      legibilidad: 'ilegitible',
      nivelConfianza: 25,
      requiereRevision: true,
      motivoRevision: 'No se distingue la fecha.',
      estadoRevision: 'requiere_revision',
    }
    const unreadableFetcher = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse(unreadableResult))
    const unreadableResponse = await handleGeminiRequest(
      request({
        operation: 'analyzeExpiration',
        image: { mimeType: 'image/jpeg', data: imageFixtures.jpeg },
      }),
      dependencies(unreadableFetcher, { now: () => fixedNow }),
    )
    expect(unreadableResponse.status).toBe(200)
    await expect(unreadableResponse.json()).resolves.toMatchObject({
      result: { requiereRevision: true, estadoRevision: 'requiere_revision' },
    })
  })

  it.each([
    {
      name: 'rejects a past date even when Gemini says it is not expired and approved',
      response: {
        ...expirationResult,
        fechaVencimiento: '2026-11-19',
        textoDetectado: 'VENCE 19/11/2026',
        vencido: false,
      },
      now: '2026-11-20T05:00:00.000Z',
      expected: { vencido: true, estadoRevision: 'rechazado' },
    },
    {
      name: 'requires review when Gemini says a future date is expired',
      response: { ...expirationResult, vencido: true },
      now: '2026-11-20T05:00:00.000Z',
      expected: { vencido: false, estadoRevision: 'requiere_revision' },
    },
    {
      name: 'requires review when manufacturing and expiration dates are equal',
      response: {
        ...expirationResult,
        fechaFabricacion: '2026-11-24',
        fechaVencimiento: '2026-11-24',
      },
      now: '2026-11-20T05:00:00.000Z',
      expected: { estadoRevision: 'requiere_revision', requiereRevision: true },
    },
    {
      name: 'requires review when manufacturing is after expiration',
      response: {
        ...expirationResult,
        fechaFabricacion: '2026-11-25',
        fechaVencimiento: '2026-11-24',
      },
      now: '2026-11-20T05:00:00.000Z',
      expected: { estadoRevision: 'requiere_revision', requiereRevision: true },
    },
    {
      name: 'uses the server evaluation date instead of a provider-supplied date',
      response: { ...expirationResult, fechaEvaluacion: '2030-01-01' },
      now: '2026-11-20T05:00:00.000Z',
      expected: { estadoRevision: 'aprobado', vencido: false },
    },
  ])('reconciles expiration semantics on the server: $name', async ({ response: result, now, expected }) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse(result))
    const fixedNow = Date.parse(now)
    const response = await handleGeminiRequest(
      request({
        operation: 'analyzeExpiration',
        image: { mimeType: 'image/jpeg', data: imageFixtures.jpeg },
      }),
      dependencies(fetcher, { now: () => fixedNow }),
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({ result: expected })
    const { fechaEvaluacion, ...normalizedResult } = body.result
    expect(fechaEvaluacion).toBe('2026-11-20')
    expect(parseResultadoVencimiento(body.result, new Date(fixedNow))).toEqual({
      ...normalizedResult,
      fechaEvaluacion: '2026-11-20',
    })
  })

  it.each([
    {
      name: 'before Lima midnight the printed day is still valid',
      now: '2026-11-23T04:59:00.000Z',
      expiry: '2026-11-22',
      expired: false,
    },
    {
      name: 'at Lima midnight the previous day has expired',
      now: '2026-11-23T05:00:00.000Z',
      expiry: '2026-11-22',
      expired: true,
    },
    {
      name: 'the new Lima calendar day remains valid at midnight',
      now: '2026-11-23T05:00:00.000Z',
      expiry: '2026-11-23',
      expired: false,
    },
  ])('uses the Lima business date: $name', async ({ now, expiry, expired }) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse({
      ...expirationResult,
      fechaVencimiento: expiry,
      textoDetectado: `VENCE ${expiry.slice(8, 10)}/${expiry.slice(5, 7)}/${expiry.slice(0, 4)}`,
      vencido: false,
    }))
    const response = await handleGeminiRequest(
      request({
        operation: 'analyzeExpiration',
        image: { mimeType: 'image/jpeg', data: imageFixtures.jpeg },
      }),
      dependencies(fetcher, { now: () => Date.parse(now) }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      result: { vencido: expired, estadoRevision: expired ? 'rechazado' : 'aprobado' },
    })
  })

  it('rejects images exceeding 40 megapixels before contacting Gemini', async () => {
    const oversizedImage = await sharp({
      create: {
        width: 6_400,
        height: 6_400,
        channels: 4,
        background: { r: 80, g: 120, b: 160, alpha: 1 },
      },
    }).png({ compressionLevel: 9 }).toBuffer()
    const fetcher = vi.fn<typeof fetch>()
    const response = await handleGeminiRequest(
      request({
        operation: 'validateFood',
        image: { mimeType: 'image/png', data: oversizedImage.toString('base64') },
      }),
      dependencies(fetcher),
    )

    expect(oversizedImage.length).toBeLessThan(3 * 1024 * 1024)
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'INVALID_IMAGE', message: 'La imagen está dañada o no se puede decodificar.' },
    })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('stops at quota exhaustion and does not retry or select another model', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 429 }))
    const response = await handleGeminiRequest(
      request({ operation: 'text', prompt: 'Describe el producto.' }),
      dependencies(fetcher),
    )
    const payload = await response.json()

    expect(response.status).toBe(429)
    expect(payload.error.message).toContain('límite gratuito')
    expect(fetcher).toHaveBeenCalledOnce()
    expect(String(fetcher.mock.calls[0][0])).toContain(GEMINI_MODEL)
  })

  it('returns a service-unavailable error for connection failures', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('network unavailable'))
    const response = await handleGeminiRequest(
      request({ operation: 'text', prompt: 'Describe el producto.' }),
      dependencies(fetcher),
    )

    expect(response.status).toBe(503)
  })

  it('rejects malformed or incomplete Gemini JSON responses', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(geminiResponse('{ invalid json'))
    const response = await handleGeminiRequest(
      request({
        operation: 'validateFood',
        image: { mimeType: 'image/png', data: imageFixtures.png },
      }),
      dependencies(fetcher),
    )

    expect(response.status).toBe(502)
  })

  it('enforces a server-side per-user request limit', async () => {
    const uid = `rate-limit-${crypto.randomUUID()}`
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => geminiResponse('ok'))
    const deps = dependencies(fetcher, { uid })
    const invoke = () => handleGeminiRequest(
      request({ operation: 'text', prompt: 'Describe el producto.' }),
      deps,
    )

    for (let index = 0; index < 20; index += 1) {
      expect((await invoke()).status).toBe(200)
    }
    expect((await invoke()).status).toBe(429)
    expect(fetcher).toHaveBeenCalledTimes(20)
  })
})
