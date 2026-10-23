import type { StoreUser } from '../types/user'
import { useProfileStoreForm, WEEK_DAYS } from '../hooks/useProfileStoreForm'

interface ProfileStoreFormProps {
  profile: StoreUser
  /** Se ejecuta tras guardar para refrescar el perfil global (menú, cabecera, etc.). */
  onSaved: () => Promise<void>
}

export default function ProfileStoreForm({ profile, onSaved }: ProfileStoreFormProps) {
  const {
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
  } = useProfileStoreForm(profile, onSaved)

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
          <input
            id="profile-business-name"
            value={form.businessName}
            onChange={(event) => updateField('businessName', event.target.value)}
            placeholder="Ej. Panadería Bonpan"
            aria-invalid={Boolean(errors.businessName)}
          />
          {errors.businessName && <span className="field-error">{errors.businessName}</span>}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="profile-ruc">RUC o DNI del titular</label>
            <input
              id="profile-ruc"
              inputMode="numeric"
              maxLength={14}
              value={form.ruc}
              onChange={(event) => updateField('ruc', event.target.value)}
              placeholder="Ingresa tu RUC o DNI"
              aria-invalid={Boolean(errors.ruc)}
            />
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
          <input
            id="profile-address"
            autoComplete="street-address"
            value={form.address}
            onChange={(event) => updateField('address', event.target.value)}
            placeholder="Calle, número y distrito"
            aria-invalid={Boolean(errors.address)}
          />
          {errors.address && <span className="field-error">{errors.address}</span>}
        </div>
        <div className="field">
          <label htmlFor="profile-reference">Punto en el mapa o referencia</label>
          <textarea
            id="profile-reference"
            value={form.reference}
            onChange={(event) => updateField('reference', event.target.value)}
            placeholder="Ej. Frente al parque Los Jardines"
            aria-invalid={Boolean(errors.reference)}
          />
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

        {form.pickupSchedule.length === 0 && (
          <p className="profile-empty-note">Aún no registras horarios de recojo.</p>
        )}

        {form.pickupSchedule.map((schedule, index) => (
          <div className="profile-schedule-item" key={index}>
            <div className="schedule-row">
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
            {scheduleErrors[index] && <span className="field-error">{scheduleErrors[index]}</span>}
          </div>
        ))}

        {errors.pickupSchedule && <span className="field-error">{errors.pickupSchedule}</span>}
        <button type="button" className="btn btn-ghost schedule-add" onClick={addSchedule}>
          + Añadir otro horario
        </button>
      </section>

      <div className="profile-actions">
        <p
          className={`profile-status${status === 'error' ? ' is-error' : status === 'saved' && !dirty ? ' is-saved' : ''}`}
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
        <div className="profile-actions-buttons">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleDiscard}
            disabled={!dirty || saving}
          >
            Descartar cambios
          </button>
          <button type="submit" className="btn btn-primary" disabled={!dirty || saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </form>
  )
}
