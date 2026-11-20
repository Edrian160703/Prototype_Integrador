import { describe, expect, it } from 'vitest'
import { parseResultadoAlimento } from '../../src/GeminiApi/services/validarAlimento'
import { parseResultadoVencimiento } from '../../src/GeminiApi/services/analizarVencimiento'
import { validateImage } from '../../src/GeminiApi/utils/validarImagen'
import { isExpiredIsoDate, isValidIsoDate } from '../../src/GeminiApi/utils/validarFecha'

describe('Gemini API image validation', () => {
  it('accepts supported image formats', () => {
    expect(validateImage(new File(['abc'], 'pan.jpg', { type: 'image/jpeg' }))).toEqual({ valid: true })
  })

  it('rejects unsupported MIME types', () => {
    const result = validateImage(new File(['abc'], 'document.txt', { type: 'text/plain' }))
    expect(result.valid).toBe(false)
  })

  it('rejects oversized images', () => {
    const data = new Uint8Array(5 * 1024 * 1024 + 1)
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
    expect(isExpiredIsoDate('2026-11-19', new Date(2026, 10, 20))).toBe(true)
    expect(isExpiredIsoDate('2026-11-21', new Date(2026, 10, 20))).toBe(false)
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

  it('returns review state for missing expiration date', () => {
    const result = parseResultadoVencimiento({
      nombreProducto: 'Leche',
      fechaFabricacion: '2026-10-01',
      fechaVencimiento: null,
      numeroLote: '123',
      textoDetectado: 'Lote 123',
      legibilidad: 'ilegitible',
      nivelConfianza: 30,
      requiereRevision: true,
      motivoRevision: 'Fecha no legible',
      estadoRevision: 'requiere_revision',
      vencido: false,
    })
    expect(result.requiereRevision).toBe(true)
    expect(result.fechaVencimiento).toBeNull()
  })

  it('rejects an already expired date', () => {
    const result = parseResultadoVencimiento({
      nombreProducto: 'Leche',
      fechaFabricacion: null,
      fechaVencimiento: '2026-11-19',
      numeroLote: null,
      textoDetectado: 'VENCE 19/11/2026',
      legibilidad: 'legible',
      nivelConfianza: 95,
      requiereRevision: false,
      motivoRevision: '',
      estadoRevision: 'aprobado',
      vencido: false,
    }, new Date(2026, 10, 20))
    expect(result.vencido).toBe(true)
    expect(result.estadoRevision).toBe('rechazado')
  })
})
