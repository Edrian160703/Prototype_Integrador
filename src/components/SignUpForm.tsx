import { type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import useSignupForm from '../hooks/useSignupForm'

export default function SignUpForm() {
  const navigate = useNavigate()
  const {
    role,
    setRole,
    values,
    errors,
    googleLoading,
    authError,
    showPassword: formShowPassword,
    setShowPassword: setFormShowPassword,
    passwordStrength,
    rolePresentation,
    availableRoles,
    updateField,
    submitWithEmail,
    submitWithGoogle,
  } = useSignupForm({
    onStepCompleted: (onboardingPath) => navigate(onboardingPath),
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitWithEmail()
  }

  const handleGoogle = () => void submitWithGoogle()

  return (
    <section className="signup-page">
      <div className="signup-card">
        <div className="signup-intro">
          <span className="signup-kicker">Únete a Foodback</span>
          <h1>Crea tu cuenta</h1>
          <p>Elige cómo quieres participar y empieza a darle una segunda oportunidad a la comida.</p>
        </div>

        <div className="role-selector" aria-label="Selecciona tu rol">
          {availableRoles.map((presentation) => (
            <button
              key={presentation.signupRole}
              type="button"
              className={`role-card${role === presentation.signupRole ? ' selected' : ''}`}
              onClick={() => setRole(presentation.signupRole)}
              aria-pressed={role === presentation.signupRole}
            >
              <span className="role-icon" aria-hidden="true">{presentation.icon}</span>
              <span><strong>{presentation.title}</strong><small>{presentation.description}</small></span>
              <span className="role-check" aria-hidden="true">{role === presentation.signupRole ? '✓' : ''}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="signup-name">{rolePresentation.nameLabel}</label>
            <input id="signup-name" value={values.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder={rolePresentation.namePlaceholder} aria-invalid={Boolean(errors.fullName)} />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>
          <div className="field">
            <label htmlFor="signup-email">Correo electrónico</label>
            <input id="signup-email" type="email" value={values.email} onChange={(event) => updateField('email', event.target.value)} placeholder="tu@correo.com" aria-invalid={Boolean(errors.email)} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="field">
            <div className="field-label-row"><label htmlFor="signup-password">Contraseña</label><span className="password-hint">Mínimo 8 caracteres</span></div>
            <div className="password-field">
              <input id="signup-password" type={formShowPassword ? 'text' : 'password'} value={values.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Crea una contraseña segura" aria-invalid={Boolean(errors.password)} />
              <button type="button" className="toggle-pass" onClick={() => setFormShowPassword((current) => !current)} aria-label={formShowPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{formShowPassword ? '🙈' : '👁'}</button>
            </div>
            {values.password && <div className={`strength strength-${passwordStrength.score}`}><span className="strength-bar"><i /></span><span>{passwordStrength.label}</span></div>}
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          {authError && <p className="field-error" role="alert">{authError}</p>}

          <button type="submit" className="btn btn-primary btn-block signup-submit" disabled={googleLoading}>Continuar</button>
        </form>

        <div className="divider-text">— o continúa con —</div>
        <button type="button" className="google-btn" onClick={handleGoogle} disabled={googleLoading}>{googleLoading ? 'Conectando...' : '🔴 Continuar con Google'}</button>
        <p className="signup-terms">Al continuar aceptas nuestros términos de servicio y política de privacidad.</p>
      </div>
    </section>
  )
}