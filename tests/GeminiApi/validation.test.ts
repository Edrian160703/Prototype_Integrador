import { describe, expect, it } from 'vitest'
import { parseResultadoAlimento } from '../../src/GeminiApi/services/validarAlimento'
import { parseResultadoVencimiento } from '../../src/GeminiApi/services/analizarVencimiento'
import { validateImage } from '../../src/GeminiApi/utils/validarImagen'
import { isExpiredIsoDate, isValidIsoDate } from '../../src/GeminiApi/utils/validarFecha'

const LIMA_BEFORE_MIDNIGHT = new Date('2026-11-23T04:59:00.000Z')
const LIMA_AT_MIDNIGHT = new Date('2026-11-23T05:00:00.000Z')

function expirationResult(overrides: Record<string, unknown> = {}) {
  return {
    nombreProducto: 'Leche',
    fechaFabricacion: '2026-10-01',
    fechaVencimiento: '2026-11-24',
    numeroLote: '123',
    textoDetectado: 'FAB 01/10/2026 VENCE 24/11/2026',
    legibilidad: 'legible',
    nivelConfianza: 95,
    requiereRevision: false,
    motivoRevision: '',
    estadoRevision: 'aprobado',
    vencido: false,
    ...overrides,
  }
}

describe('Gemini API image validation', () => {
  it('accepts supported image formats', () => {
    expect(validateImage(new File(['abc'], 'pan.jpg', { type: 'image/jpeg' }))).toEqual({ valid: true })
  })

  it('rejects unsupported MIME types', () => {
    const result = validateImage(new File(['abc'], 'document.txt', { type: 'text/plain' }))
    expect(result.valid).toBe(false)
  })

  it('rejects oversized images', () => {
    const data = new Uint8Array(3 * 1024 * 1024 + 1)
    const result = validateImage(new File([data], 'foto.jpg', { type: 'image/jpeg' }))
    expect(result.valid).toBe(false)
  })
})

describe('Gemini API date validation', () => {
  it('validates real calendar dates', () => {
    expect(isValidIsoDate('2028-02-29')).toBe(true)
    expect(isValidIsoDate('2027-02-29')).toBe(false)
  })

  it('detects expired products', () => {
    expect(isExpiredIsoDate('2026-11-19', new Date('2026-11-20T05:00:00.000Z'))).toBe(true)
    expect(isExpiredIsoDate('2026-11-21', new Date('2026-11-20T05:00:00.000Z'))).toBe(false)
  })

  it('uses the Lima calendar day across the 23:59 and 00:00 boundary', () => {
    expect(isExpiredIsoDate('2026-11-22', LIMA_BEFORE_MIDNIGHT)).toBe(false)
    expect(isExpiredIsoDate('2026-11-22', LIMA_AT_MIDNIGHT)).toBe(true)
    expect(isExpiredIsoDate('2026-11-23', LIMA_AT_MIDNIGHT)).toBe(false)
  })
})

describe('Gemini API structured responses', () => {
  it('rejects malformed food responses', () => {
    expect(() => parseResultadoAlimento({ esAlimento: true })).toThrow()
  })

  it('requires manual review for low-confidence food', () => {
    const result = parseResultadoAlimento({
      esAlimento: true,
      nombre: 'Pan',
      categoria: 'Panadería',
      descripcion: 'Pan',
      caracteristicasVisuales: ['marrón'],
      nivelConfianza: 45,
      motivo: 'Posible alimento',
      estadoRevision: 'aprobado',
    })
    expect(result.estadoRevision).toBe('requiere_revision')
  })

  it('rejects a response that identifies a non-food image', () => {
    const result = parseResultadoAlimento({
      esAlimento: false,
      nombre: '',
      categoria: '',
      descripcion: '',
      caracteristicasVisuales: [],
      nivelConfianza: 98,
      motivo: 'La imagen muestra un objeto.',
      estadoRevision: 'rechazado',
    })
    expect(result.estadoRevision).toBe('rechazado')
  })

  it('keeps an uncertain food image in manual review', () => {
    const result = parseResultadoAlimento({
      esAlimento: false,
      nombre: '',
      categoria: '',
      descripcion: '',
      caracteristicasVisuales: [],
      nivelConfianza: 35,
      motivo: 'La imagen no permite determinar el contenido.',
      estadoRevision: 'requiere_revision',
    })

    expect(result.esAlimento).toBe(false)
    expect(result.estadoRevision).toBe('requiere_revision')
  })

  it('does not approve contradictory food data', () => {
    const result = parseResultadoAlimento({
      esAlimento: false,
      nombre: 'Pan',
      categoria: 'Panadería',
      descripcion: 'Posible alimento.',
      caracteristicasVisuales: [],
      nivelConfianza: 95,
      motivo: 'Los datos son contradictorios.',
      estadoRevision: 'aprobado',
    })

    expect(result.estadoRevision).toBe('requiere_revision')
  })

  it('does not approve identified food below the confidence threshold', () => {
    const result = parseResultadoAlimento({
      esAlimento: true,
      nombre: 'Pan',
      categoria: 'Panadería',
      descripcion: 'Posible pan.',
      caracteristicasVisuales: ['forma ovalada'],
      nivelConfianza: 59,
      motivo: 'Identificación incierta.',
      estadoRevision: 'aprobado',
    })

    expect(result.estadoRevision).toBe('requiere_revision')
  })

  it('does not require Gemini to invent a commercial name', () => {
    const result = parseResultadoAlimento({
      esAlimento: true,
      nombre: '',
      categoria: 'Panadería',
      descripcion: 'Objeto dorado con forma de pan.',
      caracteristicasVisuales: ['superficie dorada'],
      nivelConfianza: 95,
      motivo: 'La imagen podría mostrar pan.',
      estadoRevision: 'aprobado',
    })

    expect(result.estadoRevision).toBe('aprobado')
  })

  it('moves low-confidence rejected non-food classification to manual review', () => {
    const result = parseResultadoAlimento({
      esAlimento: false,
      nombre: '',
      categoria: '',
      descripcion: '',
      caracteristicasVisuales: [],
      nivelConfianza: 59,
      motivo: 'Parece no comestible.',
      estadoRevision: 'rechazado',
    })
    expect(result.estadoRevision).toBe('requiere_revision')
  })

  it('moves approved state with insufficient confidence to manual review', () => {
    const result = parseResultadoAlimento({
      esAlimento: true,
      nombre: 'Producto',
      categoria: 'General',
      descripcion: 'Clasificación incierta.',
      caracteristicasVisuales: [],
      nivelConfianza: 59,
      motivo: 'Imagen ambigua.',
      estadoRevision: 'aprobado',
    })
    expect(result.estadoRevision).toBe('requiere_revision')
  })

  it('returns review state for missing expiration date', () => {
    const result = parseResultadoVencimiento(expirationResult({
      fechaVencimiento: null,
      textoDetectado: 'Lote 123',
      legibilidad: 'ilegitible',
      nivelConfianza: 30,
      requiereRevision: true,
      motivoRevision: 'Fecha no legible',
      estadoRevision: 'requiere_revision',
    }), LIMA_BEFORE_MIDNIGHT)
    expect(result.requiereRevision).toBe(true)
    expect(result.fechaVencimiento).toBeNull()
  })

  it('rejects an already expired date', () => {
    const result = parseResultadoVencimiento(expirationResult({
      fechaFabricacion: null,
      fechaVencimiento: '2026-11-19',
      textoDetectado: 'VENCE 19/11/2026',
      estadoRevision: 'aprobado',
      vencido: false,
    }), new Date('2026-11-20T05:00:00.000Z'))
    expect(result.vencido).toBe(true)
    expect(result.estadoRevision).toBe('rechazado')
  })

  it('requires review when manufacturing is equal to or later than expiration', () => {
    for (const manufacturingDate of ['2026-11-24', '2026-11-25']) {
      const result = parseResultadoVencimiento(expirationResult({
        fechaFabricacion: manufacturingDate,
      }), LIMA_BEFORE_MIDNIGHT)

      expect(result.estadoRevision).toBe('requiere_revision')
      expect(result.requiereRevision).toBe(true)
    }
  })

  it('keeps manufacturing before expiration eligible for approval', () => {
    const result = parseResultadoVencimiento(expirationResult(), LIMA_BEFORE_MIDNIGHT)

    expect(result.estadoRevision).toBe('aprobado')
    expect(result.requiereRevision).toBe(false)
  })

  it('moves impossible and incomplete dates to manual review without inventing dates', () => {
    const impossible = parseResultadoVencimiento(expirationResult({
      fechaVencimiento: '2027-02-29',
    }), LIMA_BEFORE_MIDNIGHT)
    const incomplete = parseResultadoVencimiento(expirationResult({
      fechaVencimiento: '2027-02',
    }), LIMA_BEFORE_MIDNIGHT)

    expect(impossible.fechaVencimiento).toBeNull()
    expect(impossible.estadoRevision).toBe('requiere_revision')
    expect(impossible.motivoRevision).toContain('no existe')
    expect(incomplete.fechaVencimiento).toBeNull()
    expect(incomplete.estadoRevision).toBe('requiere_revision')
    expect(incomplete.motivoRevision).toContain('completa')
  })

  it('does not approve a model expiration flag that conflicts with the Lima calendar date', () => {
    const futureDateMarkedExpired = parseResultadoVencimiento(expirationResult({
      vencido: true,
    }), LIMA_BEFORE_MIDNIGHT)
    const pastDateMarkedUnexpired = parseResultadoVencimiento(expirationResult({
      fechaVencimiento: '2026-11-21',
      vencido: false,
    }), LIMA_BEFORE_MIDNIGHT)

    expect(futureDateMarkedExpired.vencido).toBe(false)
    expect(futureDateMarkedExpired.estadoRevision).toBe('requiere_revision')
    expect(pastDateMarkedUnexpired.vencido).toBe(true)
    expect(pastDateMarkedUnexpired.estadoRevision).toBe('rechazado')
  })

  it('never preserves approval for unreadable expiration data', () => {
    const result = parseResultadoVencimiento(expirationResult({
      legibilidad: 'parcial',
      estadoRevision: 'aprobado',
      requiereRevision: false,
    }), LIMA_BEFORE_MIDNIGHT)

    expect(result.requiereRevision).toBe(true)
    expect(result.estadoRevision).toBe('requiere_revision')
  })

  it('accepts explicit expiration text that matches the interpreted date', () => {
    const result = parseResultadoVencimiento(expirationResult({
      textoDetectado: 'Producto 123 - VENCE: 24/11/2026',
      fechaEvaluacion: '2026-11-22',
    }), LIMA_BEFORE_MIDNIGHT)
    expect(result.estadoRevision).toBe('aprobado')
  })

  it('requires review for explicit expiration text that contradicts the interpreted date', () => {
    const result = parseResultadoVencimiento(expirationResult({
      textoDetectado: 'Vence: 10/05/2026',
      fechaVencimiento: '2027-05-10',
      fechaEvaluacion: '2026-11-22',
    }), LIMA_BEFORE_MIDNIGHT)
    expect(result.estadoRevision).toBe('requiere_revision')
    expect(result.motivoRevision).toContain('contradice')
  })

  it('detects expiration year differences conservatively', () => {
    const result = parseResultadoVencimiento(expirationResult({
      textoDetectado: 'VENCIMIENTO 24/11/2025',
      fechaVencimiento: '2026-11-24',
      fechaEvaluacion: '2026-11-22',
    }), LIMA_BEFORE_MIDNIGHT)
    expect(result.estadoRevision).toBe('requiere_revision')
  })

  it('requires review for ambiguous or unlabeled expiration dates', () => {
    const ambiguous = parseResultadoVencimiento(expirationResult({
      textoDetectado: 'VENCE 24-11-26',
      fechaEvaluacion: '2026-11-22',
    }), LIMA_BEFORE_MIDNIGHT)
    const unlabeled = parseResultadoVencimiento(expirationResult({
      textoDetectado: '24/11/2026',
      fechaEvaluacion: '2026-11-22',
    }), LIMA_BEFORE_MIDNIGHT)
    expect(ambiguous.estadoRevision).toBe('requiere_revision')
    expect(unlabeled.estadoRevision).toBe('requiere_revision')
  })

  it('requires review when several dates make the expiration label uncertain', () => {
    const result = parseResultadoVencimiento(expirationResult({
      textoDetectado: '01/10/2026 24/11/2026',
      fechaEvaluacion: '2026-11-22',
    }), LIMA_BEFORE_MIDNIGHT)
    expect(result.estadoRevision).toBe('requiere_revision')
  })

  it('allows manufacturing and expiration labels while checking the labeled expiration', () => {
    const result = parseResultadoVencimiento(expirationResult({
      textoDetectado: 'FAB 01/10/2026 VENCE 24/11/2026',
      fechaFabricacion: '2026-10-01',
      fechaVencimiento: '2026-11-24',
      fechaEvaluacion: '2026-11-22',
    }), LIMA_BEFORE_MIDNIGHT)
    expect(result.estadoRevision).toBe('aprobado')
  })

  it('requires review for unreadable or empty text when it leaves date uncertainty', () => {
    for (const textoDetectado of ['', 'texto ilegible']) {
      const result = parseResultadoVencimiento(expirationResult({
        textoDetectado,
        legibilidad: 'ilegitible',
        fechaEvaluacion: '2026-11-22',
      }), LIMA_BEFORE_MIDNIGHT)
      expect(result.estadoRevision).toBe('requiere_revision')
    }
  })

  it('evaluates Lima calendar-day freshness for today, yesterday and tomorrow', () => {
    const today = parseResultadoVencimiento(expirationResult({
      fechaEvaluacion: '2026-11-22',
    }), LIMA_BEFORE_MIDNIGHT)
    const yesterday = parseResultadoVencimiento(expirationResult({
      fechaEvaluacion: '2026-11-21',
    }), LIMA_BEFORE_MIDNIGHT)
    const tomorrow = parseResultadoVencimiento(expirationResult({
      fechaEvaluacion: '2026-11-23',
    }), LIMA_BEFORE_MIDNIGHT)
    expect(today.estadoRevision).toBe('aprobado')
    expect(yesterday.estadoRevision).toBe('requiere_revision')
    expect(tomorrow.estadoRevision).toBe('requiere_revision')
  })

  it('invalidates a response received before midnight when consumed after midnight', () => {
    const response = parseResultadoVencimiento(expirationResult({
      fechaEvaluacion: '2026-11-22',
    }), LIMA_BEFORE_MIDNIGHT)
    expect(response.estadoRevision).toBe('aprobado')
    const consumedAfterMidnight = parseResultadoVencimiento({
      ...response,
      fechaEvaluacion: '2026-11-22',
    }, LIMA_AT_MIDNIGHT)
    expect(consumedAfterMidnight.estadoRevision).toBe('requiere_revision')
  })
})
