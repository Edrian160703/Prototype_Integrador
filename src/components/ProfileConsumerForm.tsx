import type { ConsumerUser } from '../types/user'
import { useProfileConsumerForm, PREFERENCE_OPTIONS } from '../hooks/useProfileConsumerForm'

interface ProfileConsumerFormProps {
  profile: ConsumerUser
  /** Se ejecuta tras guardar para refrescar el perfil global (menú, cabecera, etc.). */
  onSaved: () => Promise<void>
}

export default function ProfileConsumerForm({ profile, onSaved }: ProfileConsumerFormProps) {
  const {
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
  } = useProfileConsumerForm(profile, onSaved)

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
            <input
              id="profile-first-name"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              placeholder="Ej. Ana"
              aria-invalid={Boolean(errors.firstName)}
            />
            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </div>
          <div className="field">
            <label htmlFor="profile-last-name">Apellidos</label>
            <input
              id="profile-last-name"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              placeholder="Ej. García Torres"
            />
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
            <input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              placeholder="Ej. 987 654 321"
              aria-invalid={Boolean(errors.phone)}
            />
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
          <textarea
            id="profile-location"
            value={form.habitualLocation}
            onChange={(event) => updateField('habitualLocation', event.target.value)}
            placeholder="Ej. Av. Próceres de la Independencia, SJL"
            aria-invalid={Boolean(errors.habitualLocation)}
          />
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

        <div
          className="preference-list profile-preferences"
          role="group"
          aria-labelledby="consumer-preferences-title"
        >
          {PREFERENCE_OPTIONS.map((preference) => {
            const selected = form.dietaryPreferences.includes(preference)
            return (
              <label
                className={`preference-option${selected ? ' selected' : ''}`}
                key={preference}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => togglePreference(preference)}
                />
                <span>{preference}</span>
              </label>
            )
          })}
        </div>
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
