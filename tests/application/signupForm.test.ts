import { describe, expect, it } from 'vitest'
import {
  getPasswordStrength,
  validateSignupForm,
  type SignupFormValues,
} from '../../src/utils/signupForm'

const validValues: SignupFormValues = {
  fullName: 'Ana García',
  email: 'ana@example.com',
  password: 'ClaveSegura1!',
}

describe('validateSignupForm', () => {
  it('accepts valid registration values', () => {
    expect(validateSignupForm(validValues, 'Ingresa tu nombre completo.')).toEqual({})
  })

  it('returns field-specific messages for invalid values', () => {
    expect(validateSignupForm(
      { fullName: '   ', email: 'correo-invalido', password: 'short' },
      'Ingresa tu nombre completo.',
    )).toEqual({
      fullName: 'Ingresa tu nombre completo.',
      email: 'Ingresa un correo electrónico válido.',
      password: 'Usa al menos 8 caracteres.',
    })
  })

  it('uses the role-specific required-name message', () => {
    expect(validateSignupForm(
      { ...validValues, fullName: '' },
      'Ingresa el nombre del representante.',
    ).fullName).toBe('Ingresa el nombre del representante.')
  })
})

describe('getPasswordStrength', () => {
  it('scores each supported password characteristic', () => {
    expect(getPasswordStrength('abc')).toEqual({ score: 0, label: 'Muy débil' })
    expect(getPasswordStrength('abcdefgh')).toEqual({ score: 1, label: 'Débil' })
    expect(getPasswordStrength('Abcdefgh')).toEqual({ score: 2, label: 'Aceptable' })
    expect(getPasswordStrength('Abcdefg1')).toEqual({ score: 3, label: 'Fuerte' })
    expect(getPasswordStrength('Abcdefg1!')).toEqual({ score: 4, label: 'Muy fuerte' })
  })
})
