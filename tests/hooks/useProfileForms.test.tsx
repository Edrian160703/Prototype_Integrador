import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FormEvent } from 'react'
import type { ConsumerUser, StoreUser } from '../../src/types/user'
import { useProfileConsumerForm } from '../../src/hooks/useProfileConsumerForm'
import { useProfileStoreForm } from '../../src/hooks/useProfileStoreForm'

const { saveProfileChanges } = vi.hoisted(() => ({
  saveProfileChanges: vi.fn(),
}))

vi.mock('../../src/context/ApplicationContext', () => ({
  useProfileEditing: () => ({ saveProfileChanges }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const consumer: ConsumerUser = {
  uid: 'consumer-1',
  email: 'consumer@example.com',
  displayName: 'Ada Lovelace',
  photoURL: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  onboardingCompleted: true,
  role: 'consumer',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '987654321',
  district: 'SJL',
  habitualLocation: 'Av. Central',
  dietaryPreferences: ['Panaderías'],
}

const store: StoreUser = {
  uid: 'store-1',
  email: 'store@example.com',
  displayName: 'Panadería Ada',
  photoURL: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  onboardingCompleted: true,
  role: 'store',
  businessName: 'Panadería Ada',
  ruc: '12345678',
  address: 'Av. Central 123',
  reference: 'Frente al parque',
  pickupSchedule: [{ day: 'Lunes', startTime: '17:00', endTime: '20:00' }],
}

const storeWithCoordinates: StoreUser = {
  ...store,
  latitude: -12.03,
  longitude: -77.01,
}

function submitEvent(): FormEvent<HTMLFormElement> {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>
}

describe('ciclo de edición de perfiles', () => {
  it('permite descartar y guardar cambios del perfil de consumidor', async () => {
    saveProfileChanges.mockResolvedValue(undefined)
    const onSaved = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useProfileConsumerForm(consumer, onSaved))

    act(() => result.current.updateField('firstName', 'Grace'))
    expect(result.current.dirty).toBe(true)
    act(() => result.current.handleDiscard())
    expect(result.current.form.firstName).toBe('Ada')
    expect(result.current.dirty).toBe(false)

    act(() => result.current.updateField('firstName', 'Grace'))
    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    await waitFor(() => expect(result.current.status).toBe('saved'))
    expect(saveProfileChanges).toHaveBeenCalledWith(
      'consumer-1',
      'consumer',
      expect.objectContaining({ firstName: 'Grace', phone: '987654321' }),
      'Grace Lovelace',
    )
    expect(onSaved).toHaveBeenCalledOnce()
    expect(result.current.dirty).toBe(false)
  })

  it('permite descartar y guardar cambios del perfil de comercio', async () => {
    saveProfileChanges.mockResolvedValue(undefined)
    const onSaved = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useProfileStoreForm(store, onSaved))

    act(() => result.current.updateField('businessName', 'Nuevo nombre'))
    expect(result.current.dirty).toBe(true)
    act(() => result.current.handleDiscard())
    expect(result.current.form.businessName).toBe('Panadería Ada')
    expect(result.current.dirty).toBe(false)

    act(() => result.current.updateField('businessName', 'Nuevo nombre'))
    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    await waitFor(() => expect(result.current.status).toBe('saved'))
    expect(saveProfileChanges).toHaveBeenCalledWith(
      'store-1',
      'store',
      expect.objectContaining({
        businessName: 'Nuevo nombre',
        pickupSchedule: [{ day: 'Lunes', startTime: '17:00', endTime: '20:00' }],
      }),
      'Nuevo nombre',
    )
    expect(onSaved).toHaveBeenCalledOnce()
    expect(result.current.dirty).toBe(false)
  })

  it('restaura y vuelve a guardar las coordenadas existentes del comercio', async () => {
    saveProfileChanges.mockResolvedValue(undefined)
    const { result } = renderHook(() => useProfileStoreForm(storeWithCoordinates, vi.fn()))

    expect(result.current.form).toMatchObject({ latitude: -12.03, longitude: -77.01 })
    act(() => result.current.updateField('businessName', 'Panadería actualizada'))
    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(saveProfileChanges).toHaveBeenCalledWith(
      'store-1',
      'store',
      expect.objectContaining({ latitude: -12.03, longitude: -77.01 }),
      'Panadería actualizada',
    )
  })

  it('permite guardar perfiles antiguos sin coordenadas ni escribir valores incompletos', async () => {
    saveProfileChanges.mockResolvedValue(undefined)
    const { result } = renderHook(() => useProfileStoreForm(store, vi.fn()))

    act(() => result.current.updateField('businessName', 'Panadería actualizada'))
    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    const savedProfile = saveProfileChanges.mock.calls[0][2] as Record<string, unknown>
    expect(savedProfile).not.toHaveProperty('latitude')
    expect(savedProfile).not.toHaveProperty('longitude')
  })

  it('conserva los cambios realizados mientras el guardado anterior está en curso', async () => {
    let resolveSave!: () => void
    saveProfileChanges.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSave = resolve
      }),
    )
    const { result } = renderHook(() => useProfileConsumerForm(consumer, vi.fn()))

    act(() => result.current.updateField('firstName', 'Grace'))
    let submission: Promise<void> | undefined
    act(() => {
      submission = result.current.handleSubmit(submitEvent())
    })
    act(() => result.current.updateField('firstName', 'Katherine'))

    await act(async () => {
      resolveSave()
      await submission
    })

    expect(result.current.form.firstName).toBe('Katherine')
    expect(result.current.dirty).toBe(true)
  })

  it('mantiene el error de guardado del perfil visible al usuario', async () => {
    saveProfileChanges.mockRejectedValue(new Error('Firestore no disponible'))
    const { result } = renderHook(() => useProfileConsumerForm(consumer, vi.fn()))

    act(() => result.current.updateField('firstName', 'Grace'))
    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(result.current.status).toBe('error')
    expect(result.current.statusMessage).toBe('Firestore no disponible')
    expect(result.current.dirty).toBe(true)
  })

  it('expone los errores de persistencia al guardar un perfil de comercio', async () => {
    saveProfileChanges.mockRejectedValue(new Error('Firestore no disponible'))
    const { result } = renderHook(() => useProfileStoreForm(store, vi.fn()))

    act(() => result.current.updateField('businessName', 'Panadería actualizada'))
    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(result.current.status).toBe('error')
    expect(result.current.statusMessage).toBe('Firestore no disponible')
  })

  it('mantiene la validación de horario específica del perfil de comercio', async () => {
    const { result } = renderHook(() => useProfileStoreForm(store, vi.fn()))

    act(() => result.current.updateSchedule(0, 'endTime', '16:00'))
    await act(async () => {
      await result.current.handleSubmit(submitEvent())
    })

    expect(result.current.scheduleErrors[0]).toBe(
      'La hora de fin debe ser posterior a la de inicio.',
    )
    expect(saveProfileChanges).not.toHaveBeenCalled()
  })
})
