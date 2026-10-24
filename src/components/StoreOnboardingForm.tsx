import { useState, type FormEvent } from 'react'
import type { BusinessCoordinates, PickupSchedule, StoreProfile } from '../types/user'
import MapaNegocio from './MapaNegocio'

type StoreFormValues = Required<Pick<StoreProfile, 'businessName' | 'ruc' | 'address' | 'reference'>> & {
  pickupSchedule: PickupSchedule[]
}
type StoreSubmissionValues = StoreFormValues & BusinessCoordinates

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const INITIAL_STORE_FORM: StoreFormValues = {
  businessName: '',
  ruc: '',
  address: '',
  reference: '',
  pickupSchedule: [{ day: 'Lunes', startTime: '17:00', endTime: '20:00' }],
}

interface StoreOnboardingFormProps {
  loading: boolean
  onSubmit: (profile: StoreSubmissionValues) => Promise<void>
}

export default function StoreOnboardingForm({ loading, onSubmit }: StoreOnboardingFormProps) {
  const [form, setForm] = useState<StoreFormValues>(INITIAL_STORE_FORM)
  const [location, setLocation] = useState<BusinessCoordinates | null>(null)
  const [locationError, setLocationError] = useState('')

  const updateField = (field: keyof StoreFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateSchedule = (index: number, field: keyof PickupSchedule, value: string) => {
    setForm((current) => ({
      ...current,
      pickupSchedule: current.pickupSchedule.map((schedule, scheduleIndex) =>
        scheduleIndex === index ? { ...schedule, [field]: value } : schedule
      ),
    }))
  }

  const addSchedule = () => {
    setForm((current) => ({
      ...current,
      pickupSchedule: [...current.pickupSchedule, { day: 'Martes', startTime: '17:00', endTime: '20:00' }],
    }))
  }

  const removeSchedule = (index: number) => {
    setForm((current) => ({
      ...current,
      pickupSchedule: current.pickupSchedule.filter((_, scheduleIndex) => scheduleIndex !== index),
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!location) {
      setLocationError('Selecciona una ubicación válida dentro de San Juan de Lurigancho.')
      return
    }
    setLocationError('')
    onSubmit({ ...form, ...location })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="store-name">Nombre comercial del local</label>
        <input
          id="store-name"
          required
          value={form.businessName}
          onChange={(event) => updateField('businessName', event.target.value)}
          placeholder="Ej. Panadería Bonpan"
        />
      </div>
      <div className="field">
        <label htmlFor="store-tax-id">RUC o DNI del titular</label>
        <input
          id="store-tax-id"
          required
          value={form.ruc}
          onChange={(event) => updateField('ruc', event.target.value)}
          placeholder="Ingresa tu RUC o DNI"
        />
      </div>
      <div className="field">
        <label htmlFor="store-address">Dirección exacta del local</label>
        <input
          id="store-address"
          required
          value={form.address}
          onChange={(event) => updateField('address', event.target.value)}
          placeholder="Calle, número y distrito"
        />
      </div>
      <div className="field">
        <MapaNegocio selectedLocation={location} onSelect={setLocation} />
        {location && (
          <p className="field-hint">
            Ubicación seleccionada: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        )}
        {locationError && <span className="field-error" role="alert">{locationError}</span>}
      </div>
      <div className="field">
        <label htmlFor="store-reference">Punto en el mapa o referencia</label>
        <textarea
          id="store-reference"
          required
          value={form.reference}
          onChange={(event) => updateField('reference', event.target.value)}
          placeholder="Ej. Frente al parque Los Jardines"
        />
      </div>
      <fieldset className="onboarding-schedule">
        <legend>Horarios habituales de recojo</legend>
        {form.pickupSchedule.map((schedule, index) => (
          <div className="schedule-row" key={`${schedule.day}-${index}`}>
            <select
              aria-label="Día de recojo"
              value={schedule.day}
              onChange={(event) => updateSchedule(index, 'day', event.target.value)}
            >
              {WEEK_DAYS.map((day) => (
                <option key={day}>{day}</option>
              ))}
            </select>
            <input
              aria-label="Hora de inicio"
              type="time"
              value={schedule.startTime}
              onChange={(event) => updateSchedule(index, 'startTime', event.target.value)}
            />
            <span aria-hidden="true">a</span>
            <input
              aria-label="Hora de fin"
              type="time"
              value={schedule.endTime}
              onChange={(event) => updateSchedule(index, 'endTime', event.target.value)}
            />
            {form.pickupSchedule.length > 1 && (
              <button
                type="button"
                className="schedule-remove"
                onClick={() => removeSchedule(index)}
                aria-label={`Quitar horario del ${schedule.day}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-ghost schedule-add" onClick={addSchedule}>
          + Añadir otro horario
        </button>
      </fieldset>

      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? 'Guardando perfil...' : 'Finalizar y continuar'}
      </button>
    </form>
  )
}
