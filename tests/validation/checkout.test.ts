import { describe, expect, it } from 'vitest'
import {
  formatCardNumber,
  isValidCardExpiry,
  sanitizeCardExpiry,
  validateCheckout,
} from '../../src/validation/checkout'
import type { CheckoutFormValues } from '../../src/types/checkout'

const NOW = new Date(2026, 9, 25) // octubre de 2026

const valid: CheckoutFormValues = {
  nombre: 'Ana García',
  dni: '12345678',
  telefono: '987654321',
  metodoPago: 'tienda',
  card: { number: '', expiry: '', cvv: '' },
}

describe('validateCheckout', () => {
  it('acepta un pedido en tienda sin datos de tarjeta', () => {
    expect(validateCheckout(valid, NOW)).toEqual({})
  })

  it('exige un DNI de exactamente 8 dígitos en cualquier método de pago', () => {
    for (const metodoPago of ['tienda', 'online'] as const) {
      const card = { number: '4111111111111111', expiry: '12/28', cvv: '123' }
      expect(validateCheckout({ ...valid, metodoPago, card, dni: '1234567' }, NOW).dni).toBeDefined()
      expect(validateCheckout({ ...valid, metodoPago, card, dni: '123456789' }, NOW).dni).toBeDefined()
      expect(validateCheckout({ ...valid, metodoPago, card, dni: '1234567a' }, NOW).dni).toBeDefined()
      expect(validateCheckout({ ...valid, metodoPago, card, dni: '12345678' }, NOW).dni).toBeUndefined()
    }
  })

  it('pide nombre y teléfono', () => {
    const errors = validateCheckout({ ...valid, nombre: ' ', telefono: '98765' }, NOW)
    expect(errors.nombre).toBeDefined()
    expect(errors.telefono).toBeDefined()
  })

  it('valida la tarjeta solo en pago online', () => {
    expect(validateCheckout(valid, NOW).cardNumber).toBeUndefined()

    const errors = validateCheckout({ ...valid, metodoPago: 'online' }, NOW)
    expect(errors.cardNumber).toBeDefined()
    expect(errors.cardExpiry).toBeDefined()
    expect(errors.cardCvv).toBeDefined()
  })
})

describe('datos de tarjeta', () => {
  it('rechaza fechas vencidas o con mes inválido y acepta el mes actual', () => {
    expect(isValidCardExpiry('09/26', NOW)).toBe(false)
    expect(isValidCardExpiry('10/26', NOW)).toBe(true)
    expect(isValidCardExpiry('13/28', NOW)).toBe(false)
    expect(isValidCardExpiry('1228', NOW)).toBe(false)
  })

  it('da formato al escribir', () => {
    expect(sanitizeCardExpiry('1228')).toBe('12/28')
    expect(sanitizeCardExpiry('12a')).toBe('12')
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111')
  })
})
