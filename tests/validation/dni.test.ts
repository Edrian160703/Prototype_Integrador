import { describe, expect, it } from 'vitest'
import { isValidDni, sanitizeDni } from '../../src/validation/dni'

describe('dni', () => {
  it('deja solo dígitos y máximo 8', () => {
    expect(sanitizeDni('12a34-5678 99')).toBe('12345678')
  })
  it('valida exactamente 8 dígitos', () => {
    expect(isValidDni('12345678')).toBe(true)
    expect(isValidDni('1234567')).toBe(false)
    expect(isValidDni('')).toBe(false)
  })
})
