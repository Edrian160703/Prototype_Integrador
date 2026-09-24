import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCurrentUser, updateUserProfile } from '../services/authService'
import type { ConsumerProfile, PickupSchedule, StoreProfile, UserRole } from '../types/user'

type ConsumerForm = Required<Pick<ConsumerProfile, 'phone' | 'habitualLocation'>> & {
  dietaryPreferences: string[]
}

type StoreForm = Required<Pick<StoreProfile, 'businessName' | 'ruc' | 'address' | 'reference'>> & {
  pickupSchedule: PickupSchedule[]
}

const preferenceOptions = ['Panaderías', 'Menús', 'Vegano', 'Postres', 'Frutas y verduras']
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const initialConsumerForm: ConsumerForm = {
  phone: '',
  habitualLocation: '',
  dietaryPreferences: [],
}

const initialStoreForm: StoreForm = {
  businessName: '',
  ruc: '',
  address: '',
  reference: '',
  pickupSchedule: [{ day: 'Lunes', startTime: '17:00', endTime: '20:00' }],
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos guardar tu perfil. Inténtalo nuevamente.'
}

export default function OnboardingModal() {
  const navigate = useNavigate()
  const { role: routeRole } = useParams<{ role: string }>()
  const role: UserRole = routeRole === 'comercio' || routeRole === 'store' ? 'store' : 'consumer'
  const [consumerForm, setConsumerForm] = useState(initialConsumerForm)
  const [storeForm, setStoreForm] = useState(initialStoreForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateConsumerField = (field: keyof ConsumerForm, value: string) => {
    setConsumerForm((current) => ({ ...current, [field]: value }))
  }

  const updateStoreField = (field: keyof StoreForm, value: string) => {
    setStoreForm((current) => ({ ...current, [field]: value }))
  }

  const togglePreference = (preference: string) => {
    setConsumerForm((current) => ({
      ...current,
      dietaryPreferences: current.dietaryPreferences.includes(preference)
        ? current.dietaryPreferences.filter((item) => item !== preference)
        : [...current.dietaryPreferences, preference],
    }))
  }

  const updateSchedule = (index: number, field: keyof PickupSchedule, value: string) => {
    setStoreForm((current) => ({
      ...current,
      pickupSchedule: current.pickupSchedule.map((schedule, scheduleIndex) => (
        scheduleIndex === index ? { ...schedule, [field]: value } : schedule
      )),
    }))
  }

  const addSchedule = () => {
    setStoreForm((current) => ({
      ...current,
      pickupSchedule: [...current.pickupSchedule, { day: 'Martes', startTime: '17:00', endTime: '20:00' }],
    }))
  }

  const removeSchedule = (index: number) => {
    setStoreForm((current) => ({
      ...current,
      pickupSchedule: current.pickupSchedule.filter((_, scheduleIndex) => scheduleIndex !== index),
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const currentUser = getCurrentUser()

    if (!currentUser) {
      setError('Tu sesión expiró. Regístrate o inicia sesión nuevamente.')
      return
    }

    setLoading(true)

    try {
      const profile = role === 'consumer' ? consumerForm : storeForm
      await updateUserProfile(currentUser.uid, profile)
      navigate(role === 'store' ? '/registro-negocio' : '/')
    } catch (submissionError) {
      setError(getErrorMessage(submissionError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay onboarding-overlay">
      <div className="modal-box onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className="modal-head">
          <div>
            <span className="signup-kicker">Paso 2 de tu registro</span>
            <h1 id="onboarding-title">{role === 'consumer' ? 'Cuéntanos qué buscas' : 'Completa tu comercio'}</h1>
          </div>
          <span className="onboarding-step" aria-label="Paso 2 de 2">2/2</span>
        </div>
        <p className="onboarding-intro">Estos datos nos ayudan a conectar mejor las ofertas con tu zona en San Juan de Lurigancho.</p>

        <form onSubmit={handleSubmit}>
          {role === 'consumer' ? (
            <>
              <div className="field">
                <label htmlFor="consumer-phone">Teléfono celular</label>
                <input id="consumer-phone" type="tel" required value={consumerForm.phone} onChange={(event) => updateConsumerField('phone', event.target.value)} placeholder="Ej. 987 654 321" />
              </div>
              <div className="field">
                <label htmlFor="consumer-location">Dirección o ubicación habitual</label>
                <textarea id="consumer-location" required value={consumerForm.habitualLocation} onChange={(event) => updateConsumerField('habitualLocation', event.target.value)} placeholder="Ej. Av. Próceres de la Independencia, SJL" />
              </div>
              <fieldset className="onboarding-preferences">
                <legend>¿Qué te gustaría encontrar? <span>(opcional)</span></legend>
                <div className="preference-list">
                  {preferenceOptions.map((preference) => (
                    <label className={`preference-option${consumerForm.dietaryPreferences.includes(preference) ? ' selected' : ''}`} key={preference}>
                      <input type="checkbox" checked={consumerForm.dietaryPreferences.includes(preference)} onChange={() => togglePreference(preference)} />
                      <span>{preference}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          ) : (
            <>
              <div className="field">
                <label htmlFor="store-name">Nombre comercial del local</label>
                <input id="store-name" required value={storeForm.businessName} onChange={(event) => updateStoreField('businessName', event.target.value)} placeholder="Ej. Panadería Bonpan" />
              </div>
              <div className="field">
                <label htmlFor="store-tax-id">RUC o DNI del titular</label>
                <input id="store-tax-id" required value={storeForm.ruc} onChange={(event) => updateStoreField('ruc', event.target.value)} placeholder="Ingresa tu RUC o DNI" />
              </div>
              <div className="field">
                <label htmlFor="store-address">Dirección exacta del local</label>
                <input id="store-address" required value={storeForm.address} onChange={(event) => updateStoreField('address', event.target.value)} placeholder="Calle, número y distrito" />
              </div>
              <div className="field">
                <label htmlFor="store-reference">Punto en el mapa o referencia</label>
                <textarea id="store-reference" required value={storeForm.reference} onChange={(event) => updateStoreField('reference', event.target.value)} placeholder="Ej. Frente al parque Los Jardines" />
              </div>
              <fieldset className="onboarding-schedule">
                <legend>Horarios habituales de recojo</legend>
                {storeForm.pickupSchedule.map((schedule, index) => (
                  <div className="schedule-row" key={`${schedule.day}-${index}`}>
                    <select aria-label="Día de recojo" value={schedule.day} onChange={(event) => updateSchedule(index, 'day', event.target.value)}>
                      {weekDays.map((day) => <option key={day}>{day}</option>)}
                    </select>
                    <input aria-label="Hora de inicio" type="time" value={schedule.startTime} onChange={(event) => updateSchedule(index, 'startTime', event.target.value)} />
                    <span aria-hidden="true">a</span>
                    <input aria-label="Hora de fin" type="time" value={schedule.endTime} onChange={(event) => updateSchedule(index, 'endTime', event.target.value)} />
                    {storeForm.pickupSchedule.length > 1 && <button type="button" className="schedule-remove" onClick={() => removeSchedule(index)} aria-label={`Quitar horario del ${schedule.day}`}>×</button>}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost schedule-add" onClick={addSchedule}>+ Añadir otro horario</button>
              </fieldset>
            </>
          )}

          {error && <p className="field-error onboarding-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Guardando perfil...' : 'Finalizar y continuar'}</button>
        </form>
      </div>
    </div>
  )
}