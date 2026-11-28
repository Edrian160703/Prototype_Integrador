import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginModal from '../../src/components/LoginModal'

const authMocks = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  hasAdminClaim: vi.fn(),
  navigate: vi.fn(),
  onClose: vi.fn(),
}))

vi.mock('../../src/context/ApplicationContext', () => ({
  useAdminClaimQuery: () => ({ hasAdminClaim: authMocks.hasAdminClaim }),
  useEmailSignIn: () => ({ signInWithEmail: authMocks.signInWithEmail }),
  useGoogleSignIn: () => ({ loginWithGoogle: authMocks.loginWithGoogle }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => authMocks.navigate }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeEach(() => {
  authMocks.signInWithEmail.mockReset().mockResolvedValue({
    uid: 'user-1',
    email: 'admin@example.com',
  })
  authMocks.loginWithGoogle.mockReset().mockResolvedValue({
    uid: 'user-1',
    email: 'admin@example.com',
  })
  authMocks.hasAdminClaim.mockReset()
  authMocks.navigate.mockReset()
  authMocks.onClose.mockReset()
})

function submitEmailLogin() {
  const form = screen.getByPlaceholderText('tu@correo.com').closest('form')
  if (!form) throw new Error('No se encontró el formulario de inicio de sesión.')
  fireEvent.submit(form)
}

describe('LoginModal admin claim redirect', () => {
  it('redirects email sign-ins only after a refreshed admin claim is verified', async () => {
    authMocks.hasAdminClaim.mockResolvedValue(true)
    render(<LoginModal onClose={authMocks.onClose} />)

    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password' },
    })
    submitEmailLogin()

    await waitFor(() => expect(authMocks.navigate).toHaveBeenCalledWith('/admin'))
    expect(authMocks.hasAdminClaim).toHaveBeenCalledOnce()
    expect(authMocks.onClose).toHaveBeenCalledOnce()
  })

  it('redirects Google sign-ins only when Firebase reports the admin claim', async () => {
    authMocks.hasAdminClaim.mockResolvedValue(true)
    render(<LoginModal onClose={authMocks.onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /Continuar con Google/ }))

    await waitFor(() => expect(authMocks.navigate).toHaveBeenCalledWith('/admin'))
    expect(authMocks.loginWithGoogle).toHaveBeenCalledOnce()
    expect(authMocks.hasAdminClaim).toHaveBeenCalledOnce()
    expect(authMocks.onClose).toHaveBeenCalledOnce()
  })

  it('closes normally for a valid non-admin token without redirecting', async () => {
    authMocks.hasAdminClaim.mockResolvedValue(false)
    render(<LoginModal onClose={authMocks.onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /Continuar con Google/ }))

    await waitFor(() => expect(authMocks.onClose).toHaveBeenCalledOnce())
    expect(authMocks.navigate).not.toHaveBeenCalled()
  })

  it('does not redirect or close after a network failure while refreshing claims', async () => {
    const error = new Error('network unavailable')
    authMocks.hasAdminClaim.mockRejectedValue(error)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(<LoginModal onClose={authMocks.onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /Continuar con Google/ }))

    expect((await screen.findByRole('alert')).textContent)
      .toContain('no pudimos verificar tus permisos')
    expect(authMocks.navigate).not.toHaveBeenCalled()
    expect(authMocks.onClose).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith(
      'No se pudieron verificar los permisos tras iniciar sesión.',
      error,
    )
  })

  it('does not consult claims or redirect when authentication fails', async () => {
    authMocks.signInWithEmail.mockRejectedValue(new Error('invalid credentials'))
    render(<LoginModal onClose={authMocks.onClose} />)

    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong' },
    })
    submitEmailLogin()

    expect((await screen.findByRole('alert')).textContent)
      .toContain('Correo o contraseña incorrectos')
    expect(authMocks.hasAdminClaim).not.toHaveBeenCalled()
    expect(authMocks.navigate).not.toHaveBeenCalled()
    expect(authMocks.onClose).not.toHaveBeenCalled()
  })
})
