import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OnboardingModal from '../../src/components/OnboardingModal'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getPendingSignupRole: vi.fn(),
  completeSignup: vi.fn(),
  cancelSignup: vi.fn(),
  updateUserProfile: vi.fn(),
  refreshProfile: vi.fn(),
}))
const { updateUserProfile } = mocks

vi.mock('../../src/context/ApplicationContext', () => ({
  useCurrentUserQuery: () => ({ getCurrentUser: mocks.getCurrentUser }),
  usePendingSignupQuery: () => ({ getPendingSignupRole: mocks.getPendingSignupRole }),
  useSignupCompletion: () => ({
    completeSignup: mocks.completeSignup,
    cancelSignup: mocks.cancelSignup,
  }),
  useProfileOnboarding: () => ({ updateUserProfile: mocks.updateUserProfile }),
}))

vi.mock('../../src/context/AuthContext', () => ({
  useRefreshUserProfile: () => ({ refreshProfile: mocks.refreshProfile }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderOnboarding(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/onboarding/:role" element={<OnboardingModal />} />
        <Route path="/registro" element={<p>Registro seguro</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OnboardingModal', () => {
  beforeEach(() => {
    mocks.getCurrentUser.mockReturnValue(null)
    mocks.getPendingSignupRole.mockReturnValue('consumer')
    mocks.completeSignup.mockResolvedValue(undefined)
    mocks.cancelSignup.mockResolvedValue(undefined)
    mocks.refreshProfile.mockResolvedValue(undefined)
  })

  it.each([
    ['/onboarding/consumidor', 'Cuéntanos qué buscas'],
    ['/onboarding/consumer', 'Cuéntanos qué buscas'],
    ['/onboarding/comercio', 'Completa tu comercio'],
    ['/onboarding/store', 'Completa tu comercio'],
  ])('mantiene el flujo del segmento válido %s', (path, heading) => {
    mocks.getPendingSignupRole.mockReturnValue(path.endsWith('consumidor') || path.endsWith('consumer') ? 'consumer' : 'store')
    renderOnboarding(path)

    expect(screen.getByRole('heading', { name: heading })).toBeTruthy()
    expect(screen.queryByText('Registro seguro')).toBeNull()
  })

  it('redirige los segmentos desconocidos sin permitir persistir un perfil', () => {
    renderOnboarding('/onboarding/administrator')

    expect(screen.getByText('Registro seguro')).toBeTruthy()
    expect(updateUserProfile).not.toHaveBeenCalled()
  })

  it('sin registro pendiente ni sesión vuelve al registro', () => {
    mocks.getPendingSignupRole.mockReturnValue(null)
    renderOnboarding('/onboarding/consumidor')

    expect(screen.getByText('Registro seguro')).toBeTruthy()
  })

  it('no permite completar un onboarding de otro rol distinto al registro pendiente', () => {
    mocks.getPendingSignupRole.mockReturnValue('consumer')
    renderOnboarding('/onboarding/comercio')

    expect(screen.getByText('Registro seguro')).toBeTruthy()
  })

  it('al finalizar el paso 2 crea la cuenta mediante completeSignup', async () => {
    renderOnboarding('/onboarding/consumidor')

    fireEvent.change(screen.getByLabelText('DNI'), { target: { value: '12345678' } })
    fireEvent.change(screen.getByLabelText('Teléfono celular'), { target: { value: '987654321' } })
    fireEvent.change(screen.getByLabelText('Dirección o ubicación habitual'), { target: { value: 'SJL' } })
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar y continuar' }))

    await waitFor(() => expect(mocks.completeSignup).toHaveBeenCalledOnce())
    expect(mocks.completeSignup).toHaveBeenCalledWith(expect.objectContaining({ dni: '12345678' }))
    expect(updateUserProfile).not.toHaveBeenCalled()
  })
})
