import { useState, type FormEvent } from 'react'
import { useProfileEditing } from '../context/ApplicationContext'
import useProfileEditLifecycle, { type ProfileEditStatus } from './useProfileEditLifecycle'
import type { ConsumerUser } from '../types/user'
import { isValidPhone, normalizePhone, PHONE_LENGTH } from '../validation/phone'

export const PREFERENCE_OPTIONS = ['Panaderías', 'Menús', 'Vegano', 'Postres', 'Frutas y verduras']

export interface ConsumerFormValues {
  firstName: string
  lastName: string
  phone: string
  habitualLocation: string
  dietaryPreferences: string[]
}

export type ConsumerFieldErrors = Partial<Record<'firstName' | 'phone' | 'habitualLocation', string>>
export type ConsumerSaveStatus = ProfileEditStatus

function splitDisplayName(displayName: string | null) {
  const [first = '', ...rest] = (displayName ?? '').trim().split(/\s+/).filter(Boolean)
  return { first, last: rest.join(' ') }
}

function toFormValues(profile: ConsumerUser): ConsumerFormValues {
  const fallback = splitDisplayName(profile.displayName)

  return {
    firstName: profile.firstName ?? fallback.first,
    lastName: profile.lastName ?? fallback.last,
    phone: normalizePhone(profile.phone ?? ''),
    habitualLocation: profile.habitualLocation ?? '',
    dietaryPreferences: profile.dietaryPreferences ?? [],
  }
}

function cleanValues(values: ConsumerFormValues): ConsumerFormValues {
  return {
    ...values,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: values.phone.trim(),
    habitualLocation: values.habitualLocation.trim(),
  }
}

export function useProfileConsumerForm(profile: ConsumerUser, onSaved: () => Promise<void>) {
  const { saveProfileChanges } = useProfileEditing()
  const lifecycle = useProfileEditLifecycle(toFormValues(profile))
  const { form, setForm, status, errorMessage, dirty, saving, touch, discard, beginSave, saveSucceeded, saveFailed } =
    lifecycle
  const [errors, setErrors] = useState<ConsumerFieldErrors>({})

  const updateField = (field: 'firstName' | 'lastName' | 'phone' | 'habitualLocation', value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    touch()
  }

  const togglePreference = (preference: string) => {
    setForm((current) => {
      const selected = new Set(current.dietaryPreferences)
      if (selected.has(preference)) selected.delete(preference)
      else selected.add(preference)

      const ordered = [
        ...PREFERENCE_OPTIONS.filter((option) => selected.has(option)),
        ...[...selected].filter((option) => !PREFERENCE_OPTIONS.includes(option)),
      ]
      return { ...current, dietaryPreferences: ordered }
    })
    touch()
  }

  const validate = (values: ConsumerFormValues): boolean => {
    const nextErrors: ConsumerFieldErrors = {}
    if (!values.firstName) nextErrors.firstName = 'Ingresa tu nombre.'
    if (!isValidPhone(values.phone)) nextErrors.phone = `Ingresa un celular válido de ${PHONE_LENGTH} dígitos.`
    if (!values.habitualLocation) nextErrors.habitualLocation = 'Ingresa tu dirección o ubicación habitual.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleDiscard = () => {
    discard()
    setErrors({})
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = cleanValues(form)
    if (!validate(values)) return

    beginSave()

    try {
      const displayName = [values.firstName, values.lastName].filter(Boolean).join(' ')
      await saveProfileChanges(profile.uid, profile.role, values, displayName)
      saveSucceeded(values)
      await onSaved()
    } catch (error) {
      saveFailed(error, 'No pudimos guardar tus cambios. Inténtalo nuevamente.')
    }
  }

  const statusMessage =
    status === 'saving' ? 'Guardando cambios...'
    : status === 'error' ? errorMessage
    : dirty ? 'Tienes cambios sin guardar.'
    : status === 'saved' ? '✓ Cambios guardados correctamente.'
    : ''

  return {
    form,
    errors,
    status,
    dirty,
    saving,
    statusMessage,
    updateField,
    togglePreference,
    handleDiscard,
    handleSubmit,
  }
}
