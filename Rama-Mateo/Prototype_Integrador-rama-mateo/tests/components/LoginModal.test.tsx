import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password' },
    })
    fireEvent.submit(screen.getByPlaceholderText('tu@correo.com').closest('form')!)

    expect(await screen.findByText('Dashboard de administración')).toBeTruthy()
    expect(getIdTokenResult).toHaveBeenCalledWith(true)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('mantiene el destino actual para una cuenta que no es administradora', async () => {
    signInWithEmail.mockResolvedValue(undefined)
    getIdTokenResult.mockResolvedValue({ claims: { admin: false } })
    const onClose = renderLogin()

    fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
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
  })
})
