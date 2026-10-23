import { describe, expect, it, vi } from 'vitest'
import {
  getUserDocument,
  saveProfileChanges,
  updateUserProfile,
} from '../../src/application/userProfiles'
import type {
  IAuthProfileUpdater,
  IAuthSession,
} from '../../src/ports/authGateway'
import type {
  IOnboardingProfileWriter,
  IProfileEditor,
  UserProfileReader,
} from '../../src/ports/userProfileRepository'
import type { AuthIdentity } from '../../src/ports/authGateway'

const identity: AuthIdentity = {
  uid: 'user-1',
  email: 'user@example.com',
  displayName: 'Ana García',
  photoURL: null,
}

describe('casos de uso de perfiles', () => {
  it('delega la consulta de perfil al lector', async () => {
    const profile = {
      uid: 'user-1',
      email: 'user@example.com',
      displayName: 'Ana García',
      photoURL: null,
      role: 'consumer' as const,
      createdAt: new Date('2026-01-01T00:00:00'),
      updatedAt: new Date('2026-01-02T00:00:00'),
      onboardingCompleted: true,
    }
    const reader: UserProfileReader = {
      getById: vi.fn().mockResolvedValue(profile),
    }

    await expect(getUserDocument(reader, 'user-1')).resolves.toBe(profile)
    expect(reader.getById).toHaveBeenCalledWith('user-1')
  })

  it('delega la finalización del onboarding al escritor correspondiente', async () => {
    const writer: IOnboardingProfileWriter = {
      updateOnboarding: vi.fn().mockResolvedValue(undefined),
    }
    const profile = { firstName: 'Ana', lastName: 'García' }

    await expect(updateUserProfile(writer, 'user-1', 'consumer', profile))
      .resolves.toBeUndefined()
    expect(writer.updateOnboarding).toHaveBeenCalledWith('user-1', 'consumer', profile)
  })

  it('actualiza el nombre de autenticación solo para el usuario activo', async () => {
    const session: IAuthSession = {
      currentUser: identity,
      onAuthStateChanged: vi.fn(),
    }
    const authUpdater: IAuthProfileUpdater = {
      updateDisplayName: vi.fn().mockResolvedValue(undefined),
    }
    const editor: IProfileEditor = {
      saveChanges: vi.fn().mockResolvedValue(undefined),
    }
    const profile = { firstName: 'Ana' }

    await saveProfileChanges(session, authUpdater, editor, 'user-1', 'consumer', profile, 'Ana García')

    expect(editor.saveChanges).toHaveBeenCalledWith(
      'user-1',
      'consumer',
      profile,
      'Ana García',
    )
    expect(authUpdater.updateDisplayName).toHaveBeenCalledWith('user-1', 'Ana García')
  })

  it('no actualiza el nombre de autenticación de otra sesión', async () => {
    const session: IAuthSession = {
      currentUser: identity,
      onAuthStateChanged: vi.fn(),
    }
    const authUpdater: IAuthProfileUpdater = {
      updateDisplayName: vi.fn(),
    }
    const editor: IProfileEditor = {
      saveChanges: vi.fn().mockResolvedValue(undefined),
    }

    await saveProfileChanges(
      session,
      authUpdater,
      editor,
      'user-2',
      'consumer',
      { firstName: 'Luis' },
      'Luis Pérez',
    )

    expect(editor.saveChanges).toHaveBeenCalledOnce()
    expect(authUpdater.updateDisplayName).not.toHaveBeenCalled()
  })
})
