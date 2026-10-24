import { useState, type FormEvent } from 'react'
import type { ConsumerProfile } from '../types/user'
import { isValidDni, sanitizeDni, DNI_LENGTH } from '../validation/dni'
import { isValidPhone, PHONE_LENGTH } from '../validation/phone'
import PhoneField from './PhoneField'

type ConsumerFormValues = Required<Pick<ConsumerProfile, 'dni' | 'phone' | 'habitualLocation'>> & {
  dietaryPreferences: string[]
}

const PREFERENCE_OPTIONS = ['Panaderías', 'Menús', 'Vegano', 'Postres', 'Frutas y verduras']

const INITIAL_CONSUMER_FORM: ConsumerFormValues = {
  dni: '',
  phone: '',
  habitualLocation: '',
  dietaryPreferences: [],
}

interface ConsumerOnboardingFormProps {
  loading: boolean
  onSubmit: (profile: ConsumerFormValues) => Promise<void>
}

export default function ConsumerOnboardingForm({ loading, onSubmit }: ConsumerOnboardingFormProps) {
  const [form, setForm] = useState<ConsumerFormValues>(INITIAL_CONSUMER_FORM)
  const [dniTouched, setDniTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const dniInvalid = !isValidDni(form.dni)
  const phoneInvalid = !isValidPhone(form.phone)

  const updateField = (field: keyof ConsumerFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const togglePreference = (preference: string) => {
    setForm((current) => ({
      ...current,
      dietaryPreferences: current.dietaryPreferences.includes(preference)
        ? current.dietaryPreferences.filter((item) => item !== preference)
        : [...current.dietaryPreferences, preference],
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (dniInvalid || phoneInvalid) {
      setDniTouched(true)
      setPhoneTouched(true)
      return
    }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="consumer-dni">DNI</label>
        <input
          id="consumer-dni"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required
          maxLength={DNI_LENGTH}
          pattern={`\\d{${DNI_LENGTH}}`}
          value={form.dni}
          onChange={(event) => updateField('dni', sanitizeDni(event.target.value))}
          onBlur={() => setDniTouched(true)}
          aria-invalid={dniTouched && dniInvalid}
          placeholder="Ej. 12345678"
        />
        {dniTouched && dniInvalid && (
          <span className="field-error">Ingresa un DNI válido de {DNI_LENGTH} dígitos.</span>
        )}
      </div>
      <PhoneField
        id="consumer-phone"
        label="Teléfono celular"
        required
        value={form.phone}
        onChange={(value) => updateField('phone', value)}
        onBlur={() => setPhoneTouched(true)}
        invalid={phoneTouched && phoneInvalid}
        error={phoneTouched && phoneInvalid ? `Ingresa un celular válido de ${PHONE_LENGTH} dígitos.` : undefined}
      />
      <div className="field">
        <label htmlFor="consumer-location">Dirección o ubicación habitual</label>
        <textarea
          id="consumer-location"
          required
          value={form.habitualLocation}
          onChange={(event) => updateField('habitualLocation', event.target.value)}
          placeholder="Ej. Av. Próceres de la Independencia, SJL"
        />
      </div>
      <fieldset className="onboarding-preferences">
        <legend>
          ¿Qué te gustaría encontrar? <span>(opcional)</span>
        </legend>
        <div className="preference-list">
          {PREFERENCE_OPTIONS.map((preference) => (
            <label
              className={`preference-option${form.dietaryPreferences.includes(preference) ? ' selected' : ''}`}
              key={preference}
            >
              <input
                type="checkbox"
                checked={form.dietaryPreferences.includes(preference)}
                onChange={() => togglePreference(preference)}
              />
              <span>{preference}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? 'Guardando perfil...' : 'Finalizar y continuar'}
      </button>
    </form>
  )
}
