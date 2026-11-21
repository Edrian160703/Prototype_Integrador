import { describe, expect, it, vi } from 'vitest'
import type { Auth, User } from 'firebase/auth'
import { getRedirectResult, signInWithRedirect } from 'firebase/auth'
import { FirebaseAuthGateway } from '../../src/infrastructure/firebase/FirebaseAuthGateway'

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {},
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}))

function createGateway(currentUser: User | null): FirebaseAuthGateway {
  return new FirebaseAuthGateway({ currentUser } as unknown as Auth)
}

describe('FirebaseAuthGateway Google redirect', () => {
  it('starts Google sign-in with redirect', async () => {
    vi.mocked(signInWithRedirect).mockResolvedValue(undefined)
    const gateway = createGateway(null)

    await gateway.startSignInWithGoogle()

    expect(signInWithRedirect).toHaveBeenCalledOnce()
  })

  it('returns the authenticated identity after a Google redirect', async () => {
    vi.mocked(getRedirectResult).mockResolvedValue({
      user: { uid: 'user-1', email: 'ana@example.com', displayName: 'Ana', photoURL: null },
    } as never)
    const gateway = createGateway(null)

    await expect(gateway.consumeGoogleRedirect()).resolves.toEqual({
      uid: 'user-1',
      email: 'ana@example.com',
      displayName: 'Ana',
      photoURL: null,
    })
  })

  it('returns null when there is no pending Google redirect', async () => {
    vi.mocked(getRedirectResult).mockResolvedValue(null)
    const gateway = createGateway(null)

    await expect(gateway.consumeGoogleRedirect()).resolves.toBeNull()
  })
})

describe('FirebaseAuthGateway admin claims', () => {
  it('forces a Firebase ID token refresh and accepts only the boolean admin claim', async () => {
    const getIdTokenResult = vi.fn().mockResolvedValue({
      claims: { admin: true },
    })
    const user = { getIdTokenResult } as unknown as User
    const gateway = createGateway(user)

    await expect(gateway.hasAdminClaim(true)).resolves.toBe(true)
    expect(getIdTokenResult).toHaveBeenCalledWith(true)
  })

  it('rejects string-like admin claim values', async () => {
    const getIdTokenResult = vi.fn().mockResolvedValue({
      claims: { admin: 'true' },
    })
    const gateway = createGateway({ getIdTokenResult } as unknown as User)

    await expect(gateway.hasAdminClaim(true)).resolves.toBe(false)
  })

  it('returns false when there is no authenticated user', async () => {
    const gateway = createGateway(null)

    await expect(gateway.hasAdminClaim(true)).resolves.toBe(false)
  })

  it('propagates token refresh failures so the UI cannot assume admin access', async () => {
    const getIdTokenResult = vi.fn().mockRejectedValue(new Error('network unavailable'))
    const gateway = createGateway({ getIdTokenResult } as unknown as User)

    await expect(gateway.hasAdminClaim(true)).rejects.toThrow('network unavailable')
  })
})
