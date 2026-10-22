import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OnboardingModal from '../../src/components/OnboardingModal'

const { getCurrentUser, updateUserProfile } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  updateUserProfile: vi.fn(),
}))

vi.mock('../../src/context/ApplicationContext', () => ({
  useCurrentUserQuery: () => ({ getCurrentUser }),
  useProfileOnboarding: () => ({ updateUserProfile }),
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
  it.each([
    ['/onboarding/consumidor', 'Cuéntanos qué buscas'],
    ['/onboarding/consumer', 'Cuéntanos qué buscas'],
    ['/onboarding/comercio', 'Completa tu comercio'],
    ['/onboarding/store', 'Completa tu comercio'],
  ])('mantiene el flujo del segmento válido %s', (path, heading) => {
    renderOnboarding(path)

    expect(screen.getByRole('heading', { name: heading })).toBeTruthy()
    expect(screen.queryByText('Registro seguro')).toBeNull()
  })

  it('redirige los segmentos desconocidos sin permitir persistir un perfil', () => {
    renderOnboarding('/onboarding/administrator')

    expect(screen.getByText('Registro seguro')).toBeTruthy()
    expect(updateUserProfile).not.toHaveBeenCalled()
  })
})
