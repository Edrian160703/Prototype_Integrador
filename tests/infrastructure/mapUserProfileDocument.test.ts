import { describe, expect, it } from 'vitest'
import { mapUserProfileDocument } from '../../src/infrastructure/firebase/mapUserProfileDocument'

const commonDocument: Record<string, unknown> = {
  role: 'consumer',
  email: 'ana@example.com',
  displayName: 'Ana García',
  photoURL: null,
  createdAt: new Date('2026-10-01T12:00:00'),
  updatedAt: new Date('2026-10-02T12:00:00'),
  onboardingCompleted: true,
}

describe('mapUserProfileDocument', () => {
  it('convierte un perfil de consumidor válido', () => {
    expect(mapUserProfileDocument('user-1', 'consumidores', {
      ...commonDocument,
      firstName: 'Ana',
      dietaryPreferences: ['Panaderías'],
    })).toMatchObject({
      uid: 'user-1',
      role: 'consumer',
      email: 'ana@example.com',
      firstName: 'Ana',
      dietaryPreferences: ['Panaderías'],
    })
  })

  it('convierte un perfil de comercio y valida sus horarios', () => {
    expect(mapUserProfileDocument('store-1', 'comercios', {
      ...commonDocument,
      role: 'store',
      businessName: 'Panadería Ana',
      pickupSchedule: [{ day: 'Lunes', startTime: '17:00', endTime: '20:00' }],
      verificationStatus: 'pending',
    })).toMatchObject({
      uid: 'store-1',
      role: 'store',
      businessName: 'Panadería Ana',
      pickupSchedule: [{ day: 'Lunes', startTime: '17:00', endTime: '20:00' }],
      verificationStatus: 'pending',
    })
  })

  it.each([
    ['rol diferente a la colección', 'consumidores', { role: 'store' }, 'no coincide'],
    ['correo ausente', 'consumidores', { email: undefined }, '"email"'],
    ['fecha ausente', 'consumidores', { createdAt: undefined }, 'fecha'],
    ['onboarding con tipo incorrecto', 'consumidores', { onboardingCompleted: 'true' }, 'onboardingCompleted'],
    ['preferencias mal formadas', 'consumidores', { dietaryPreferences: 'Panaderías' }, 'dietaryPreferences'],
    ['horario mal formado', 'comercios', {
      role: 'store',
      pickupSchedule: [{ day: 'Lunes', startTime: 17, endTime: '20:00' }],
    }, 'pickupSchedule'],
    ['estado de verificación no permitido', 'comercios', {
      role: 'store',
      verificationStatus: 'approved',
    }, 'verificación'],
  ])('rechaza %s', (_case, collectionName, overrides, message) => {
    expect(() => mapUserProfileDocument('user-1', collectionName, {
      ...commonDocument,
      ...overrides,
    })).toThrow(message)
  })
})
