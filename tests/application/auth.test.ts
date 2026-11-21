import { describe, expect, it, vi } from 'vitest'
import {
  completeGoogleRedirect,
  hasAdminClaim,
  loginWithGoogle,
  registerWithEmail,
  signInWithGoogle,
} from '../../src/application/auth'
import type {
  AuthIdentity,
  IAuthAdminClaimReader,
  IAuthRegistrar,
  IAuthSignIn,
} from '../../src/ports/authGateway'
import type { IProfileCreator } from '../../src/ports/userProfileRepository'

const identity: AuthIdentity = {
  uid: 'user-1',
  email: 'ana@example.com',
  displayName: 'Ana García',
  photoURL: null,
}

function createProfileCreator(): IProfileCreator {
  return { createIfMissing: vi.fn().mockResolvedValue(undefined) }
}

describe('casos de uso de autenticación', () => {
  it('refresca los claims del token antes de consultar acceso administrativo', async () => {
    const auth: IAuthAdminClaimReader = {
      hasAdminClaim: vi.fn().mockResolvedValue(true),
    }

    await expect(hasAdminClaim(auth)).resolves.toBe(true)
    expect(auth.hasAdminClaim).toHaveBeenCalledWith(true)
  })

  it('registra la cuenta y crea su perfil inicial', async () => {
    const auth: IAuthRegistrar = {
      registerWithEmail: vi.fn().mockResolvedValue(identity),
    }
    const profiles = createProfileCreator()

    await expect(
      registerWithEmail(auth, profiles, 'ana@example.com', 'secret', 'consumer', {
        firstName: 'Ana',
        lastName: 'García',
      }),
    ).resolves.toBe(identity)

    expect(auth.registerWithEmail).toHaveBeenCalledWith(
      'ana@example.com',
      'secret',
      'Ana García',
    )
    expect(profiles.createIfMissing).toHaveBeenCalledWith(
      identity,
      {
        role: 'consumer',
        displayName: 'Ana García',
        profile: { firstName: 'Ana', lastName: 'García' },
      },
    )
  })

  it('crea un perfil para nuevos usuarios de Google con el rol solicitado', async () => {
    const auth: IAuthSignIn = {
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn().mockResolvedValue(identity),
      startSignInWithGoogle: vi.fn().mockResolvedValue(undefined),
      consumeGoogleRedirect: vi.fn().mockResolvedValue(null),
    }
    const profiles = createProfileCreator()

    await signInWithGoogle(auth, profiles, 'store', { businessName: 'Panadería Ana' })

    expect(profiles.createIfMissing).toHaveBeenCalledWith(identity, {
      role: 'store',
      profile: { businessName: 'Panadería Ana' },
    })
  })

  it('inicializa como consumidor el perfil al entrar por Google', async () => {
    const auth: IAuthSignIn = {
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn().mockResolvedValue(identity),
      startSignInWithGoogle: vi.fn().mockResolvedValue(undefined),
      consumeGoogleRedirect: vi.fn().mockResolvedValue(null),
    }
    const profiles = createProfileCreator()

    await expect(loginWithGoogle(auth, profiles)).resolves.toBeNull()
    expect(auth.startSignInWithGoogle).toHaveBeenCalledOnce()
    expect(profiles.createIfMissing).not.toHaveBeenCalled()
  })

  it('completa una redirección de Google y crea el perfil consumidor', async () => {
    const auth: IAuthSignIn = {
      signInWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      startSignInWithGoogle: vi.fn(),
      consumeGoogleRedirect: vi.fn().mockResolvedValue(identity),
    }
    const profiles = createProfileCreator()

    await expect(completeGoogleRedirect(auth, profiles)).resolves.toEqual(identity)
    expect(profiles.createIfMissing).toHaveBeenCalledWith(identity, { role: 'consumer' })
  })
})
