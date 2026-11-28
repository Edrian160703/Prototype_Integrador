import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/infrastructure/firebase/firebaseClient', () => ({ getFirebaseApp: vi.fn() }))

import {
  parseExpirationDateResponse,
  parseFoodScanResponse,
  rejectionMessage,
} from '../../src/infrastructure/ai/foodImageScanner'

describe('parseFoodScanResponse', () => {
  it('acepta comida con confianza suficiente', () => {
    const r = parseFoodScanResponse('{"is_food":true,"confidence":0.9,"label":"arroz","reason":"ok"}')
    expect(r.isFood).toBe(true)
  })

  it('rechaza comida con confianza baja', () => {
    expect(parseFoodScanResponse('{"is_food":true,"confidence":0.3,"label":"?","reason":""}').isFood).toBe(false)
  })

  it('rechaza lo que no es comida', () => {
    expect(parseFoodScanResponse('{"is_food":false,"confidence":0.99,"label":"auto","reason":""}').isFood).toBe(false)
  })

  it('tolera bloques de código markdown', () => {
    const r = parseFoodScanResponse('```json\n{"is_food":true,"confidence":0.8,"label":"pan","reason":""}\n```')
    expect(r.isFood).toBe(true)
  })

  it('rechaza si faltan campos', () => {
    expect(parseFoodScanResponse('{}').isFood).toBe(false)
  })

  it('no expone la etiqueta técnica de Gemini en el rechazo', () => {
    expect(rejectionMessage({ isFood: false, confidence: 1, label: 'auto', reason: '' }))
      .toBe('La imagen principal debe mostrar claramente un alimento.')
  })
})

describe('parseExpirationDateResponse', () => {
  it('acepta una fecha legible, inequívoca y normalizada', () => {
    expect(parseExpirationDateResponse(JSON.stringify({
      is_legible: true,
      is_unambiguous: true,
      date_iso: '2027-05-09',
      confidence: 0.95,
    }))).toEqual({
      isLegible: true,
      isUnambiguous: true,
      dateISO: '2027-05-09',
      confidence: 0.95,
    })
  })

  it('rechaza resultados ambiguos, de baja confianza o con una fecha imposible', () => {
    const ambiguous = parseExpirationDateResponse(JSON.stringify({
      is_legible: true,
      is_unambiguous: false,
      date_iso: '2027-05-09',
      confidence: 0.95,
    }))
    const lowConfidence = parseExpirationDateResponse(JSON.stringify({
      is_legible: true,
      is_unambiguous: true,
      date_iso: '2027-05-09',
      confidence: 0.4,
    }))
    const impossibleDate = parseExpirationDateResponse(JSON.stringify({
      is_legible: true,
      is_unambiguous: true,
      date_iso: '2027-02-29',
      confidence: 0.95,
    }))

    expect(ambiguous.isUnambiguous).toBe(false)
    expect(lowConfidence.isLegible).toBe(false)
    expect(impossibleDate.dateISO).toBeNull()
  })
})
