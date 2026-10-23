import { describe, expect, it } from 'vitest'
import { maskDni } from '../../src/utils/dniMask'

describe('maskDni', () => {
  it('muestra los 3 primeros dígitos y oculta el resto', () => {
    expect(maskDni('13345678')).toBe('133*****')
  })
  it('devuelve vacío si no hay DNI', () => {
    expect(maskDni(undefined)).toBe('')
    expect(maskDni(null)).toBe('')
    expect(maskDni('')).toBe('')
  })
  it('ignora caracteres no numéricos y excedentes', () => {
    expect(maskDni('133-456-789')).toBe('133*****')
  })
})
