import { describe, expect, it, vi } from 'vitest'
import type { Auth, User } from 'firebase/auth'
import { FirebaseAuthGateway } from '../../src/infrastructure/firebase/FirebaseAuthGateway'

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {},
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}))

function createGateway(currentUser: User | null): FirebaseAuthGateway {
  return new FirebaseAuthGateway({ currentUser } as unknown as Auth)
}

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
