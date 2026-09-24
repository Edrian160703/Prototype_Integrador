import { useState, type FormEvent } from 'react'
import { saveProfileChanges } from '../services/authService'
import type { ConsumerUser } from '../types/user'

const PREFERENCE_OPTIONS = ['Panaderías', 'Menús', 'Vegano', 'Postres', 'Frutas y verduras']

interface ConsumerFormValues {
  firstName: string
  lastName: string
  phone: string
  habitualLocation: string
  dietaryPreferences: string[]
}

type FieldErrors = Partial<Record<'firstName' | 'phone' | 'habitualLocation', string>>
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface ProfileConsumerFormProps {
  profile: ConsumerUser
  /** Se ejecuta tras guardar para refrescar el perfil global (menú, cabecera, etc.). */
  onSaved: () => Promise<void>
}

/** Cuentas creadas con Google no guardan nombre/apellido: se derivan del displayName. */
function splitDisplayName(displayName: string | null) {
  const [first = '', ...rest] = (displayName ?? '').trim().split(/\s+/).filter(Boolean)
  return { first, last: rest.join(' ') }
}

function toFormValues(profile: ConsumerUser): ConsumerFormValues {
  const fallback = splitDisplayName(profile.displayName)

  return {
    firstName: profile.firstName ?? fallback.first,
    lastName: profile.lastName ?? fallback.last,
    phone: profile.phone ?? '',
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

/** Celular peruano: 9 dígitos, con o sin prefijo +51. */
function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 9 || (digits.length === 11 && digits.startsWith('51'))
}

export default function ProfileConsumerForm({ profile, onSaved }: ProfileConsumerFormProps) {
  const [baseline, setBaseline] = useState(() => toFormValues(profile))
  const [form, setForm] = useState(baseline)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline)
  const saving = status === 'saving'

  const touch = () => setStatus((current) => (current === 'saving' ? current : 'idle'))

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

      // Se mantiene el orden del catálogo para que "dirty" no cambie por el orden de clic.
      const ordered = [
        ...PREFERENCE_OPTIONS.filter((option) => selected.has(option)),
        ...[...selected].filter((option) => !PREFERENCE_OPTIONS.includes(option)),
      ]
      return { ...current, dietaryPreferences: ordered }
    })
    touch()
  }

  const validate = (values: ConsumerFormValues) => {
    const nextErrors: FieldErrors = {}
    if (!values.firstName) nextErrors.firstName = 'Ingresa tu nombre.'
    if (!isValidPhone(values.phone)) nextErrors.phone = 'Ingresa un celular válido de 9 dígitos.'
    if (!values.habitualLocation) nextErrors.habitualLocation = 'Ingresa tu dirección o ubicación habitual.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleDiscard = () => {
    setForm(baseline)
    setErrors({})
    setStatus('idle')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = cleanValues(form)
    if (!validate(values)) return

    setStatus('saving')
    setErrorMessage('')

    try {
      const displayName = [values.firstName, values.lastName].filter(Boolean).join(' ')
      await saveProfileChanges(profile.uid, values, displayName)
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
      <section className="profile-section" aria-labelledby="consumer-personal-title">
        <header className="profile-section-head">
          <span className="profile-section-icon" aria-hidden="true">👤</span>
          <div>
            <h2 id="consumer-personal-title">Datos personales</h2>
            <p>Así te identificamos cuando reservas una oferta.</p>
          </div>
        </header>

        <div className="field-row">
          <div className="field">
            <label htmlFor="profile-first-name">Nombre</label>
            <input id="profile-first-name" autoComplete="given-name" value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} placeholder="Ej. Ana" aria-invalid={Boolean(errors.firstName)} />
            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </div>
          <div className="field">
            <label htmlFor="profile-last-name">Apellidos</label>
            <input id="profile-last-name" autoComplete="family-name" value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} placeholder="Ej. García Torres" />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="profile-email">Correo electrónico</label>
            <input id="profile-email" type="email" value={profile.email} readOnly disabled />
            <small className="field-hint">Es tu usuario de acceso y no se puede modificar.</small>
          </div>
          <div className="field">
            <label htmlFor="profile-phone">Teléfono celular</label>
            <input id="profile-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Ej. 987 654 321" aria-invalid={Boolean(errors.phone)} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="consumer-location-title">
        <header className="profile-section-head">
          <span className="profile-section-icon" aria-hidden="true">📍</span>
          <div>
            <h2 id="consumer-location-title">Ubicación habitual</h2>
            <p>La usamos para mostrarte primero las ofertas más cercanas en San Juan de Lurigancho.</p>
          </div>
        </header>

        <div className="field">
          <label htmlFor="profile-location">Dirección o ubicación habitual</label>
          <textarea id="profile-location" value={form.habitualLocation} onChange={(event) => updateField('habitualLocation', event.target.value)} placeholder="Ej. Av. Próceres de la Independencia, SJL" aria-invalid={Boolean(errors.habitualLocation)} />
          {errors.habitualLocation && <span className="field-error">{errors.habitualLocation}</span>}
        </div>
      </section>

      <section className="profile-section" aria-labelledby="consumer-preferences-title">
        <header className="profile-section-head">
          <span className="profile-section-icon" aria-hidden="true">🍽️</span>
          <div>
            <h2 id="consumer-preferences-title">Preferencias</h2>
            <p>Elige lo que te gustaría encontrar (opcional). Puedes cambiarlo cuando quieras.</p>
          </div>
        </header>

        <div className="preference-list profile-preferences" role="group" aria-labelledby="consumer-preferences-title">
          {PREFERENCE_OPTIONS.map((preference) => {
            const selected = form.dietaryPreferences.includes(preference)
            return (
              <label className={`preference-option${selected ? ' selected' : ''}`} key={preference}>
                <input type="checkbox" checked={selected} onChange={() => togglePreference(preference)} />
                <span>{preference}</span>
              </label>
            )
          })}
        </div>
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
