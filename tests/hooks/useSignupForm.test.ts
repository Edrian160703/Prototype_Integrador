import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useSignupForm from '../../src/hooks/useSignupForm'

const mocks = vi.hoisted(() => ({
  startEmailSignup: vi.fn(),
  startGoogleSignup: vi.fn(),
}))

vi.mock('../../src/context/ApplicationContext', () => ({
  useSignupStart: () => ({
    startEmailSignup: mocks.startEmailSignup,
    startGoogleSignup: mocks.startGoogleSignup,
  }),
}))

describe('useSignupForm', () => {
  beforeEach(() => {
    mocks.startEmailSignup.mockReset()
    mocks.startGoogleSignup.mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => cleanup())

  it('guarda el registro por correo con el rol seleccionado y delega navegación al consumidor', () => {
    const onStepCompleted = vi.fn()
    const { result } = renderHook(() => useSignupForm({ onStepCompleted }))

    act(() => {
      result.current.setRole('business')
      result.current.updateField('fullName', 'Ana García')
      result.current.updateField('email', 'ana@example.com')
      result.current.updateField('password', 'ClaveSegura1!')
    })
    act(() => result.current.submitWithEmail())

    expect(mocks.startEmailSignup).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'ClaveSegura1!',
      role: 'store',
      profile: {},
    })
    expect(onStepCompleted).toHaveBeenCalledWith('/onboarding/comercio')
  })

  it('muestra validaciones y no intenta registrar datos inválidos', async () => {
    const { result } = renderHook(() => useSignupForm({
      onStepCompleted: vi.fn(),
    }))

    act(() => result.current.submitWithEmail())

    expect(result.current.errors).toEqual({
      fullName: 'Ingresa tu nombre completo.',
      email: 'Ingresa un correo electrónico válido.',
      password: 'Usa al menos 8 caracteres.',
    })
    expect(mocks.startEmailSignup).not.toHaveBeenCalled()
  })

  it('muestra el error y restablece la carga si falla el registro con Google', async () => {
    mocks.startGoogleSignup.mockRejectedValueOnce(new Error('Cuenta existente'))
    const { result } = renderHook(() => useSignupForm({
      onStepCompleted: vi.fn(),
    }))

    await act(async () => result.current.submitWithGoogle())

    expect(result.current.authError).toBe('Cuenta existente')
    expect(result.current.googleLoading).toBe(false)
  })

  it('registra con Google usando el rol seleccionado', async () => {
    const onStepCompleted = vi.fn()
    const { result } = renderHook(() => useSignupForm({ onStepCompleted }))

    act(() => result.current.setRole('business'))
    await act(async () => result.current.submitWithGoogle())

    expect(mocks.startGoogleSignup).toHaveBeenCalledWith('store')
    expect(onStepCompleted).toHaveBeenCalledWith('/onboarding/comercio')
  })
})
