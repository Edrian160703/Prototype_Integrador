import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/infrastructure/firebase/firebaseClient', () => ({ getFirebaseApp: vi.fn() }))

import { parseFoodScanResponse, rejectionMessage } from '../../src/infrastructure/ai/foodImageScanner'

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

  it('arma el mensaje de rechazo con lo detectado', () => {
    expect(rejectionMessage({ isFood: false, confidence: 1, label: 'auto', reason: '' })).toContain('auto')
  })
})
