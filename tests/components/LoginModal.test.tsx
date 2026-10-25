import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
<<<<<<< HEAD
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginModal from '../../src/components/LoginModal'

const { signInWithEmail, loginWithGoogle, getIdTokenResult } = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  getIdTokenResult: vi.fn(),
}))

vi.mock('../../src/context/ApplicationContext', () => ({
  useEmailSignIn: () => ({ signInWithEmail }),
  useGoogleSignIn: () => ({ loginWithGoogle }),
}))

vi.mock('../../src/infrastructure/firebase/firebaseClient', () => ({
  getFirebaseAuth: () => ({
    currentUser: { getIdTokenResult },
  }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function renderLogin() {
  const onClose = vi.fn()
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<><p>Inicio</p><LoginModal onClose={onClose} /></>} />
        <Route path="/admin" element={<p>Dashboard de administración</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return onClose
}

describe('redirección de acceso administrativo', () => {
  it('redirige al dashboard cuando el inicio con correo devuelve el claim admin', async () => {
    signInWithEmail.mockResolvedValue(undefined)
    getIdTokenResult.mockResolvedValue({ claims: { admin: true } })
    const onClose = renderLogin()
=======
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
>>>>>>> rama-diego

    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password' },
    })
<<<<<<< HEAD
    fireEvent.submit(screen.getByPlaceholderText('tu@correo.com').closest('form')!)

    expect(await screen.findByText('Dashboard de administración')).toBeTruthy()
    expect(getIdTokenResult).toHaveBeenCalledWith(true)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('mantiene el destino actual para una cuenta que no es administradora', async () => {
    signInWithEmail.mockResolvedValue(undefined)
    getIdTokenResult.mockResolvedValue({ claims: { admin: false } })
    const onClose = renderLogin()
=======
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
>>>>>>> rama-diego

    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
<<<<<<< HEAD
      target: { value: 'password' },
    })
    fireEvent.submit(screen.getByPlaceholderText('tu@correo.com').closest('form')!)

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(screen.getByText('Inicio')).toBeTruthy()
    expect(screen.queryByText('Dashboard de administración')).toBeNull()
  })

  it('también redirige a los administradores que inician con Google', async () => {
    loginWithGoogle.mockResolvedValue(undefined)
    getIdTokenResult.mockResolvedValue({ claims: { admin: true } })
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: '🔴 Continuar con Google' }))

    expect(await screen.findByText('Dashboard de administración')).toBeTruthy()
    expect(loginWithGoogle).toHaveBeenCalledOnce()
=======
      target: { value: 'wrong' },
    })
    submitEmailLogin()

    expect((await screen.findByRole('alert')).textContent)
      .toContain('Correo o contraseña incorrectos')
    expect(authMocks.hasAdminClaim).not.toHaveBeenCalled()
    expect(authMocks.navigate).not.toHaveBeenCalled()
    expect(authMocks.onClose).not.toHaveBeenCalled()
>>>>>>> rama-diego
  })
})
