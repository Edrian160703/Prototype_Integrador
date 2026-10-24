import { describe, expect, it, vi } from 'vitest'
import {
  cancelSignup,
  completeSignup,
  getPendingSignupRole,
  startEmailSignup,
  startGoogleSignup,
} from '../../src/application/signup'
import { InMemorySignupDraftStore } from '../../src/infrastructure/InMemorySignupDraftStore'
import type { AuthIdentity } from '../../src/ports/authGateway'
import type { IProfileCreator } from '../../src/ports/userProfileRepository'

const identity: AuthIdentity = {
  uid: 'user-1',
  email: 'ana@example.com',
  displayName: 'Ana García',
  photoURL: null,
}

function createAuth() {
  return {
    registerWithEmail: vi.fn().mockResolvedValue(identity),
    deleteCurrentAccount: vi.fn().mockResolvedValue(undefined),
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn().mockResolvedValue(identity),
    signOut: vi.fn().mockResolvedValue(undefined),
  }
}

function createProfiles(): IProfileCreator & { createIfMissing: ReturnType<typeof vi.fn> } {
  return { createIfMissing: vi.fn().mockResolvedValue(undefined) }
}

describe('registro en dos pasos', () => {
  it('el paso 1 por correo solo guarda el borrador, sin cuenta ni documento', () => {
    const auth = createAuth()
    const profiles = createProfiles()
    const drafts = new InMemorySignupDraftStore()

    startEmailSignup(drafts, {
      email: 'ana@example.com',
      password: 'ClaveSegura1!',
      role: 'consumer',
      profile: { firstName: 'Ana', lastName: 'García' },
    })

    expect(getPendingSignupRole(drafts)).toBe('consumer')
    expect(auth.registerWithEmail).not.toHaveBeenCalled()
    expect(profiles.createIfMissing).not.toHaveBeenCalled()
  })

  it('el paso 2 crea la cuenta y el documento con el onboarding completo', async () => {
    const auth = createAuth()
    const profiles = createProfiles()
    const drafts = new InMemorySignupDraftStore()
    startEmailSignup(drafts, {
      email: 'ana@example.com',
      password: 'ClaveSegura1!',
      role: 'consumer',
      profile: { firstName: 'Ana', lastName: 'García' },
    })

    await expect(completeSignup(auth, profiles, drafts, { dni: '12345678', phone: '987654321' }))
      .resolves.toBe(identity)

    expect(auth.registerWithEmail).toHaveBeenCalledWith('ana@example.com', 'ClaveSegura1!', 'Ana García')
    expect(profiles.createIfMissing).toHaveBeenCalledWith(identity, {
      role: 'consumer',
      displayName: 'Ana García',
      profile: { firstName: 'Ana', lastName: 'García', dni: '12345678', phone: '987654321' },
      onboardingCompleted: true,
    })
    expect(drafts.get()).toBeNull()
  })

  it('revierte la cuenta por correo si falla el guardado del documento', async () => {
    const auth = createAuth()
    const profiles = createProfiles()
    profiles.createIfMissing.mockRejectedValueOnce(new Error('Firestore caído'))
    const drafts = new InMemorySignupDraftStore()
    startEmailSignup(drafts, { email: 'ana@example.com', password: 'ClaveSegura1!', role: 'consumer' })

    await expect(completeSignup(auth, profiles, drafts, {})).rejects.toThrow('Firestore caído')

    expect(auth.deleteCurrentAccount).toHaveBeenCalledOnce()
    expect(drafts.get()).not.toBeNull()
  })

  it('con Google no registra de nuevo: solo crea el documento al completar el paso 2', async () => {
    const auth = createAuth()
    const profiles = createProfiles()
    const drafts = new InMemorySignupDraftStore()

    await startGoogleSignup(auth, drafts, 'store')
    expect(profiles.createIfMissing).not.toHaveBeenCalled()

    await completeSignup(auth, profiles, drafts, { businessName: 'Panadería Ana', ruc: '20123456789' })

    expect(auth.registerWithEmail).not.toHaveBeenCalled()
    expect(profiles.createIfMissing).toHaveBeenCalledWith(identity, {
      role: 'store',
      displayName: 'Panadería Ana',
      profile: { businessName: 'Panadería Ana', ruc: '20123456789' },
      onboardingCompleted: true,
    })
  })

  it('falla si no hay registro pendiente', async () => {
    const auth = createAuth()
    const profiles = createProfiles()

    await expect(completeSignup(auth, profiles, new InMemorySignupDraftStore(), {}))
      .rejects.toThrow('Tu registro expiró')
    expect(auth.registerWithEmail).not.toHaveBeenCalled()
  })

  it('cancelar limpia el borrador y cierra la sesión solo si venía de Google', async () => {
    const auth = createAuth()
    const drafts = new InMemorySignupDraftStore()

    startEmailSignup(drafts, { email: 'ana@example.com', password: 'ClaveSegura1!', role: 'consumer' })
    await cancelSignup(auth, drafts)
    expect(drafts.get()).toBeNull()
    expect(auth.signOut).not.toHaveBeenCalled()

    await startGoogleSignup(auth, drafts, 'consumer')
    await cancelSignup(auth, drafts)
    expect(drafts.get()).toBeNull()
    expect(auth.signOut).toHaveBeenCalledOnce()
  })
})
