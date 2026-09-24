import { useState, type FormEvent } from 'react'
import { saveProfileChanges } from '../services/authService'
import type { PickupSchedule, StoreUser } from '../types/user'

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface StoreFormValues {
  businessName: string
  ruc: string
  address: string
  reference: string
  pickupSchedule: PickupSchedule[]
}

type FieldErrors = Partial<Record<'businessName' | 'ruc' | 'address' | 'reference' | 'pickupSchedule', string>>
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface ProfileStoreFormProps {
  profile: StoreUser
  /** Se ejecuta tras guardar para refrescar el perfil global (menú, cabecera, etc.). */
  onSaved: () => Promise<void>
}

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

/** DNI (8 dígitos) o RUC (11 dígitos). */
function isValidTaxId(value: string) {
  return /^(\d{8}|\d{11})$/.test(value)
}

function validateSchedule(schedule: PickupSchedule) {
  if (!schedule.startTime || !schedule.endTime) return 'Completa la hora de inicio y la de fin.'
  if (schedule.startTime >= schedule.endTime) return 'La hora de fin debe ser posterior a la de inicio.'
  return ''
}

export default function ProfileStoreForm({ profile, onSaved }: ProfileStoreFormProps) {
  const [baseline, setBaseline] = useState(() => toFormValues(profile))
  const [form, setForm] = useState(baseline)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [scheduleErrors, setScheduleErrors] = useState<Record<number, string>>({})
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline)
  const saving = status === 'saving'

  const touch = () => setStatus((current) => (current === 'saving' ? current : 'idle'))

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

  const validate = (values: StoreFormValues) => {
    const nextErrors: FieldErrors = {}
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
    setForm(baseline)
    setErrors({})
    setScheduleErrors({})
    setStatus('idle')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = cleanValues(form)
    if (!validate(values)) return

    setStatus('saving')
    setErrorMessage('')

    try {
      await saveProfileChanges(profile.uid, profile.role, values, values.businessName)
      setBaseline(values)
      setForm(values)
      setStatus('saved')
      await onSaved()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos guardar tus cambios. Inténtalo nuevamente.')
      setStatus('error')
    }
  }

  const statusMessage =
    status === 'saving' ? 'Guardando cambios...'
    : status === 'error' ? errorMessage
    : dirty ? 'Tienes cambios sin guardar.'
    : status === 'saved' ? '✓ Cambios guardados correctamente.'
    : ''

  return (
    <form className="profile-form" onSubmit={handleSubmit} noValidate>
      <section className="profile-section" aria-labelledby="store-business-title">
        <header className="profile-section-head">
          <span className="profile-section-icon" aria-hidden="true">🏪</span>
          <div>
            <h2 id="store-business-title">Datos del comercio</h2>
            <p>Esta información se muestra a los consumidores en tus ofertas.</p>
          </div>
        </header>

        <div className="field">
          <label htmlFor="profile-business-name">Nombre comercial del local</label>
          <input id="profile-business-name" value={form.businessName} onChange={(event) => updateField('businessName', event.target.value)} placeholder="Ej. Panadería Bonpan" aria-invalid={Boolean(errors.businessName)} />
          {errors.businessName && <span className="field-error">{errors.businessName}</span>}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="profile-ruc">RUC o DNI del titular</label>
            <input id="profile-ruc" inputMode="numeric" maxLength={14} value={form.ruc} onChange={(event) => updateField('ruc', event.target.value)} placeholder="Ingresa tu RUC o DNI" aria-invalid={Boolean(errors.ruc)} />
            {errors.ruc && <span className="field-error">{errors.ruc}</span>}
          </div>
          <div className="field">
            <label htmlFor="profile-email">Correo electrónico</label>
            <input id="profile-email" type="email" value={profile.email} readOnly disabled />
            <small className="field-hint">Es tu usuario de acceso y no se puede modificar.</small>
          </div>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="store-location-title">
        <header className="profile-section-head">
          <span className="profile-section-icon" aria-hidden="true">📍</span>
          <div>
            <h2 id="store-location-title">Ubicación del local</h2>
            <p>Ayuda a los consumidores a llegar fácilmente a recoger sus pedidos.</p>
          </div>
        </header>

        <div className="field">
          <label htmlFor="profile-address">Dirección exacta del local</label>
          <input id="profile-address" autoComplete="street-address" value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Calle, número y distrito" aria-invalid={Boolean(errors.address)} />
          {errors.address && <span className="field-error">{errors.address}</span>}
        </div>
        <div className="field">
          <label htmlFor="profile-reference">Punto en el mapa o referencia</label>
          <textarea id="profile-reference" value={form.reference} onChange={(event) => updateField('reference', event.target.value)} placeholder="Ej. Frente al parque Los Jardines" aria-invalid={Boolean(errors.reference)} />
          {errors.reference && <span className="field-error">{errors.reference}</span>}
        </div>
      </section>

      <section className="profile-section" aria-labelledby="store-schedule-title">
        <header className="profile-section-head">
          <span className="profile-section-icon" aria-hidden="true">🕒</span>
          <div>
            <h2 id="store-schedule-title">Horarios habituales de recojo</h2>
            <p>Los consumidores solo podrán recoger sus reservas dentro de estos horarios.</p>
          </div>
        </header>

        {form.pickupSchedule.length === 0 && <p className="profile-empty-note">Aún no registras horarios de recojo.</p>}

        {form.pickupSchedule.map((schedule, index) => (
          <div className="profile-schedule-item" key={index}>
            <div className="schedule-row">
              <select aria-label="Día de recojo" value={schedule.day} onChange={(event) => updateSchedule(index, 'day', event.target.value)}>
                {WEEK_DAYS.map((day) => <option key={day}>{day}</option>)}
              </select>
              <input aria-label="Hora de inicio" type="time" value={schedule.startTime} onChange={(event) => updateSchedule(index, 'startTime', event.target.value)} />
              <span aria-hidden="true">a</span>
              <input aria-label="Hora de fin" type="time" value={schedule.endTime} onChange={(event) => updateSchedule(index, 'endTime', event.target.value)} />
              {form.pickupSchedule.length > 1 && <button type="button" className="schedule-remove" onClick={() => removeSchedule(index)} aria-label={`Quitar horario del ${schedule.day}`}>×</button>}
            </div>
            {scheduleErrors[index] && <span className="field-error">{scheduleErrors[index]}</span>}
          </div>
        ))}

        {errors.pickupSchedule && <span className="field-error">{errors.pickupSchedule}</span>}
        <button type="button" className="btn btn-ghost schedule-add" onClick={addSchedule}>+ Añadir otro horario</button>
      </section>

      <div className="profile-actions">
        <p className={`profile-status${status === 'error' ? ' is-error' : status === 'saved' && !dirty ? ' is-saved' : ''}`} role="status" aria-live="polite">{statusMessage}</p>
        <div className="profile-actions-buttons">
          <button type="button" className="btn btn-outline" onClick={handleDiscard} disabled={!dirty || saving}>Descartar cambios</button>
          <button type="submit" className="btn btn-primary" disabled={!dirty || saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </div>
    </form>
  )
}
