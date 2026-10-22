import { useState, type FormEvent } from 'react'
import type { ConsumerProfile } from '../types/user'

type ConsumerFormValues = Required<Pick<ConsumerProfile, 'phone' | 'habitualLocation'>> & {
  dietaryPreferences: string[]
}

const PREFERENCE_OPTIONS = ['Panaderías', 'Menús', 'Vegano', 'Postres', 'Frutas y verduras']

const INITIAL_CONSUMER_FORM: ConsumerFormValues = {
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
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="consumer-phone">Teléfono celular</label>
        <input
          id="consumer-phone"
          type="tel"
          required
          value={form.phone}
          onChange={(event) => updateField('phone', event.target.value)}
          placeholder="Ej. 987 654 321"
        />
      </div>
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
