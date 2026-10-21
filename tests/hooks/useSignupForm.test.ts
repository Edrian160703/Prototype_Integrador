import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useSignupForm from '../../src/hooks/useSignupForm'

const mocks = vi.hoisted(() => ({
  registerWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
}))

vi.mock('../../src/context/ApplicationContext', () => ({
  useAuthRegistration: () => ({
    registerWithEmail: mocks.registerWithEmail,
    signInWithGoogle: mocks.signInWithGoogle,
  }),
}))

describe('useSignupForm', () => {
  beforeEach(() => {
    mocks.registerWithEmail.mockReset().mockResolvedValue(undefined)
    mocks.signInWithGoogle.mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => cleanup())

  it('registra por correo con el rol seleccionado y delega navegación al consumidor', async () => {
    const onRegistrationComplete = vi.fn()
    const { result } = renderHook(() => useSignupForm({ onRegistrationComplete }))

    act(() => {
      result.current.setRole('business')
      result.current.updateField('fullName', 'Ana García')
      result.current.updateField('email', 'ana@example.com')
      result.current.updateField('password', 'ClaveSegura1!')
    })
    await act(async () => result.current.submitWithEmail())

    expect(mocks.registerWithEmail).toHaveBeenCalledWith(
      'ana@example.com',
      'ClaveSegura1!',
      'store',
      {},
    )
    expect(onRegistrationComplete).toHaveBeenCalledWith('/onboarding/comercio')
  })

  it('muestra validaciones y no intenta registrar datos inválidos', async () => {
    const { result } = renderHook(() => useSignupForm({
      onRegistrationComplete: vi.fn(),
    }))

    await act(async () => result.current.submitWithEmail())

    expect(result.current.errors).toEqual({
      fullName: 'Ingresa tu nombre completo.',
      email: 'Ingresa un correo electrónico válido.',
      password: 'Usa al menos 8 caracteres.',
    })
    expect(mocks.registerWithEmail).not.toHaveBeenCalled()
  })

  it('mantiene errores y estados de carga al fallar el registro', async () => {
    mocks.registerWithEmail.mockRejectedValueOnce(new Error('Cuenta existente'))
    const { result } = renderHook(() => useSignupForm({
      onRegistrationComplete: vi.fn(),
    }))

    act(() => {
      result.current.updateField('fullName', 'Ana García')
      result.current.updateField('email', 'ana@example.com')
      result.current.updateField('password', 'ClaveSegura1!')
    })
    await act(async () => result.current.submitWithEmail())

    expect(result.current.authError).toBe('Cuenta existente')
    expect(result.current.loading).toBe(false)
  })

  it('registra con Google usando el rol seleccionado', async () => {
    const onRegistrationComplete = vi.fn()
    const { result } = renderHook(() => useSignupForm({ onRegistrationComplete }))

    act(() => result.current.setRole('business'))
    await act(async () => result.current.submitWithGoogle())

    expect(mocks.signInWithGoogle).toHaveBeenCalledWith('store')
    expect(onRegistrationComplete).toHaveBeenCalledWith('/onboarding/comercio')
  })
})
