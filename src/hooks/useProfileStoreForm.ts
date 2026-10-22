import { useState, type FormEvent } from 'react'
import { useProfileEditing } from '../context/ApplicationContext'
import useProfileEditLifecycle, { type ProfileEditStatus } from './useProfileEditLifecycle'
import type { PickupSchedule, StoreUser } from '../types/user'

export const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export interface StoreFormValues {
  businessName: string
  ruc: string
  address: string
  reference: string
  pickupSchedule: PickupSchedule[]
}

export type StoreFieldErrors = Partial<Record<'businessName' | 'ruc' | 'address' | 'reference' | 'pickupSchedule', string>>
export type StoreSaveStatus = ProfileEditStatus

function toFormValues(profile: StoreUser): StoreFormValues {
  return {
    businessName: profile.businessName ?? '',
    ruc: profile.ruc ?? '',
    address: profile.address ?? '',
    reference: profile.reference ?? '',
    pickupSchedule: profile.pickupSchedule ?? [],
  }
}

function cleanValues(values: StoreFormValues): StoreFormValues {
  return {
    ...values,
    businessName: values.businessName.trim(),
    ruc: values.ruc.replace(/\s/g, ''),
    address: values.address.trim(),
    reference: values.reference.trim(),
  }
}

function isValidTaxId(value: string): boolean {
  return /^(\d{8}|\d{11})$/.test(value)
}

function validateSchedule(schedule: PickupSchedule): string {
  if (!schedule.startTime || !schedule.endTime) return 'Completa la hora de inicio y la de fin.'
  if (schedule.startTime >= schedule.endTime) return 'La hora de fin debe ser posterior a la de inicio.'
  return ''
}

export function useProfileStoreForm(profile: StoreUser, onSaved: () => Promise<void>) {
  const { saveProfileChanges } = useProfileEditing()
  const lifecycle = useProfileEditLifecycle(toFormValues(profile))
  const { form, setForm, status, errorMessage, dirty, saving, touch, discard, beginSave, saveSucceeded, saveFailed } =
    lifecycle
  const [errors, setErrors] = useState<StoreFieldErrors>({})
  const [scheduleErrors, setScheduleErrors] = useState<Record<number, string>>({})

  const updateField = (field: 'businessName' | 'ruc' | 'address' | 'reference', value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    touch()
  }

  const updateSchedule = (index: number, field: keyof PickupSchedule, value: string) => {
    setForm((current) => ({
      ...current,
      pickupSchedule: current.pickupSchedule.map((schedule, scheduleIndex) => (
        scheduleIndex === index ? { ...schedule, [field]: value } : schedule
      )),
    }))
    setScheduleErrors((current) => ({ ...current, [index]: '' }))
    setErrors((current) => ({ ...current, pickupSchedule: undefined }))
    touch()
  }

  const addSchedule = () => {
    setForm((current) => ({
      ...current,
      pickupSchedule: [...current.pickupSchedule, { day: 'Lunes', startTime: '17:00', endTime: '20:00' }],
    }))
    setErrors((current) => ({ ...current, pickupSchedule: undefined }))
    touch()
  }

  const removeSchedule = (index: number) => {
    setForm((current) => ({
      ...current,
      pickupSchedule: current.pickupSchedule.filter((_, scheduleIndex) => scheduleIndex !== index),
    }))
    setScheduleErrors({})
    touch()
  }

  const validate = (values: StoreFormValues): boolean => {
    const nextErrors: StoreFieldErrors = {}
    const nextScheduleErrors: Record<number, string> = {}

    if (!values.businessName) nextErrors.businessName = 'Ingresa el nombre comercial de tu local.'
    if (!isValidTaxId(values.ruc)) nextErrors.ruc = 'Ingresa un DNI (8 dígitos) o RUC (11 dígitos) válido.'
    if (!values.address) nextErrors.address = 'Ingresa la dirección exacta del local.'
    if (!values.reference) nextErrors.reference = 'Ingresa un punto en el mapa o referencia.'

    if (values.pickupSchedule.length === 0) {
      nextErrors.pickupSchedule = 'Agrega al menos un horario de recojo.'
    }
    values.pickupSchedule.forEach((schedule, index) => {
      const message = validateSchedule(schedule)
      if (message) nextScheduleErrors[index] = message
    })

    setErrors(nextErrors)
    setScheduleErrors(nextScheduleErrors)
    return Object.keys(nextErrors).length === 0 && Object.keys(nextScheduleErrors).length === 0
  }

  const handleDiscard = () => {
    discard()
    setErrors({})
    setScheduleErrors({})
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = cleanValues(form)
    if (!validate(values)) return

    beginSave()

    try {
      await saveProfileChanges(profile.uid, profile.role, values, values.businessName)
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
    scheduleErrors,
    status,
    dirty,
    saving,
    statusMessage,
    updateField,
    updateSchedule,
    addSchedule,
    removeSchedule,
    handleDiscard,
    handleSubmit,
  }
}
