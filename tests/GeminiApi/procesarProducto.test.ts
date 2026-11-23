import { describe, expect, it, vi } from 'vitest'
import { createProcesarProducto } from '../../src/GeminiApi/services/procesarProducto'
import { parseResultadoVencimiento } from '../../src/GeminiApi/services/analizarVencimiento'

describe('procesarProducto dependency ports', () => {
  it('coordinates injected analysis and persistence services without binding them to Firebase', async () => {
    const food = {
      esAlimento: true,
      nombre: 'Pan',
      categoria: 'Panadería',
      descripcion: 'Pan recién horneado.',
      caracteristicasVisuales: ['superficie dorada'],
      nivelConfianza: 94,
      motivo: 'Alimento identificable.',
      estadoRevision: 'aprobado' as const,
    }
    const expiration = {
      nombreProducto: 'Pan',
      fechaFabricacion: null,
      fechaVencimiento: '2027-03-15',
      numeroLote: null,
      textoDetectado: 'VENCE 15/03/2027',
      legibilidad: 'legible' as const,
      nivelConfianza: 91,
      requiereRevision: false,
      motivoRevision: '',
      estadoRevision: 'aprobado' as const,
      vencido: false,
      fechaEvaluacion: '2026-11-22',
    }
    const saveAnalysis = vi.fn(async () => 'analysis-id')
    const validateFood = vi.fn(async () => food)
    const analyzeExpiration = vi.fn(async () => expiration)
    const processProduct = createProcesarProducto({
      currentUser: { getUserId: () => 'registered-user' },
      images: {
        validate: () => ({ valid: true }),
        toInlineData: async (file) => ({ mimeType: file.type, data: 'encoded-image' }),
      },
      analyzers: { validateFood, analyzeExpiration },
      repository: {
        uploadImage: async (userId, type) => ({ ruta: `${userId}/${type}` }),
        saveAnalysis,
      },
    })

    const result = await processProduct(
      new File(['food'], 'food.jpg', { type: 'image/jpeg' }),
      new File(['label'], 'label.jpg', { type: 'image/jpeg' }),
    )

    expect(result.puedePublicarse).toBe(true)
    expect(validateFood).toHaveBeenCalledOnce()
    expect(analyzeExpiration).toHaveBeenCalledOnce()
    expect(saveAnalysis).toHaveBeenCalledTimes(2)
    expect(saveAnalysis).toHaveBeenNthCalledWith(1, expect.objectContaining({
      usuarioId: 'registered-user',
      tipoAnalisis: 'alimento',
    }))
    expect(saveAnalysis).toHaveBeenNthCalledWith(2, expect.objectContaining({
      usuarioId: 'registered-user',
      tipoAnalisis: 'vencimiento',
    }))
  })

  it('prevents publication when expiration dates are chronologically contradictory', async () => {
    const food = {
      esAlimento: true,
      nombre: 'Pan',
      categoria: 'Panadería',
      descripcion: 'Pan recién horneado.',
      caracteristicasVisuales: ['superficie dorada'],
      nivelConfianza: 94,
      motivo: 'Alimento identificable.',
      estadoRevision: 'aprobado' as const,
    }
    const expiration = parseResultadoVencimiento({
      nombreProducto: 'Pan',
      fechaFabricacion: '2026-11-25',
      fechaVencimiento: '2026-11-24',
      numeroLote: null,
      textoDetectado: 'FAB 25/11/2026 VENCE 24/11/2026',
      legibilidad: 'legible',
      nivelConfianza: 95,
      requiereRevision: false,
      motivoRevision: '',
      estadoRevision: 'aprobado',
      vencido: false,
    }, new Date('2026-11-23T04:59:00.000Z'))
    const processProduct = createProcesarProducto({
      currentUser: { getUserId: () => 'registered-user' },
      images: {
        validate: () => ({ valid: true }),
        toInlineData: async (file) => ({ mimeType: file.type, data: 'encoded-image' }),
      },
      analyzers: {
        validateFood: async () => food,
        analyzeExpiration: async () => expiration,
      },
      repository: {
        uploadImage: async (userId, type) => ({ ruta: `${userId}/${type}` }),
        saveAnalysis: async () => 'analysis-id',
      },
    })

    const result = await processProduct(
      new File(['food'], 'food.jpg', { type: 'image/jpeg' }),
      new File(['label'], 'label.jpg', { type: 'image/jpeg' }),
    )

    expect(result.puedePublicarse).toBe(false)
    expect(result.vencimiento?.estadoRevision).toBe('requiere_revision')
    expect(result.mensaje).toContain('revisión manual')
  })

  it('prevents publication and persistence approval with an obsolete evaluation', async () => {
    const food = {
      esAlimento: true,
      nombre: 'Pan',
      categoria: 'Panadería',
      descripcion: 'Pan',
      caracteristicasVisuales: [],
      nivelConfianza: 95,
      motivo: 'Identificable.',
      estadoRevision: 'aprobado' as const,
    }
    const expiration = {
      nombreProducto: 'Pan',
      fechaFabricacion: null,
      fechaVencimiento: '2027-03-15',
      numeroLote: null,
      textoDetectado: 'VENCE 15/03/2027',
      legibilidad: 'legible' as const,
      nivelConfianza: 91,
      requiereRevision: false,
      motivoRevision: '',
      estadoRevision: 'aprobado' as const,
      vencido: false,
      fechaEvaluacion: '2026-11-21',
    }
    const processProduct = createProcesarProducto({
      currentUser: { getUserId: () => 'registered-user' },
      clock: () => new Date('2026-11-23T04:59:00.000Z'),
      images: {
        validate: () => ({ valid: true }),
        toInlineData: async (file) => ({ mimeType: file.type, data: 'encoded-image' }),
      },
      analyzers: {
        validateFood: async () => food,
        analyzeExpiration: async () => expiration,
      },
      repository: {
        uploadImage: async (userId, type) => ({ ruta: `${userId}/${type}` }),
        saveAnalysis: async () => 'analysis-id',
      },
    })

    const result = await processProduct(
      new File(['food'], 'food.jpg', { type: 'image/jpeg' }),
      new File(['label'], 'label.jpg', { type: 'image/jpeg' }),
    )

    expect(result.puedePublicarse).toBe(false)
    expect(result.vencimiento?.estadoRevision).toBe('requiere_revision')
    expect(result.mensaje).toContain('nuevo análisis')
  })
})
