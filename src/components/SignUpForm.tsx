import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerWithEmail, signInWithGoogle } from '../bootstrap'
import { SIGNUP_PRESENTATION } from '../config/signupPresentation'
import {
  getSignupRoleStrategy,
  type SignupRole,
} from '../strategies/userRoleStrategies'

interface FormValues {
  fullName: string
  email: string
  password: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = { fullName: '', email: '', password: '' }

function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte']
  return { score, label: labels[score] }
}

export default function SignUpForm() {
  const navigate = useNavigate()
  const [role, setRole] = useState<SignupRole>('consumer')
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const passwordStrength = useMemo(() => getPasswordStrength(values.password), [values.password])
  const roleStrategy = getSignupRoleStrategy(role)
  const rolePresentation = SIGNUP_PRESENTATION.find((option) => option.signupRole === role)
  if (!rolePresentation) throw new Error(`No signup presentation is registered for role "${role}".`)

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.fullName.trim()) nextErrors.fullName = rolePresentation.missingNameMessage
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = 'Ingresa un correo electrónico válido.'
    if (values.password.length < 8) nextErrors.password = 'Usa al menos 8 caracteres.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const redirectToOnboarding = () => {
    navigate(rolePresentation.onboardingPath)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    setAuthError('')

    registerWithEmail(
      values.email,
      values.password,
      roleStrategy.userRole,
      roleStrategy.createInitialProfile(values.fullName),
    )
      .then(redirectToOnboarding)
      .catch((error: unknown) => {
        setAuthError(error instanceof Error ? error.message : 'No pudimos crear tu cuenta.')
      })
      .finally(() => setLoading(false))
  }

  const handleGoogle = () => {
    setGoogleLoading(true)
    setAuthError('')

    signInWithGoogle(roleStrategy.userRole)
      .then(redirectToOnboarding)
      .catch((error: unknown) => {
        setAuthError(error instanceof Error ? error.message : 'No pudimos conectar con Google.')
      })
      .finally(() => setGoogleLoading(false))
  }

  return (
    <section className="signup-page">
      <div className="signup-card">
        <div className="signup-intro">
          <span className="signup-kicker">Únete a Foodback</span>
          <h1>Crea tu cuenta</h1>
          <p>Elige cómo quieres participar y empieza a darle una segunda oportunidad a la comida.</p>
        </div>

        <div className="role-selector" aria-label="Selecciona tu rol">
          {SIGNUP_PRESENTATION.map((presentation) => (
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
              <input id="signup-password" type={showPassword ? 'text' : 'password'} value={values.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Crea una contraseña segura" aria-invalid={Boolean(errors.password)} />
              <button type="button" className="toggle-pass" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? '🙈' : '👁'}</button>
            </div>
            {values.password && <div className={`strength strength-${passwordStrength.score}`}><span className="strength-bar"><i /></span><span>{passwordStrength.label}</span></div>}
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          {authError && <p className="field-error" role="alert">{authError}</p>}

          <button type="submit" className="btn btn-primary btn-block signup-submit" disabled={loading || googleLoading}>{loading ? 'Creando cuenta...' : 'Continuar'}</button>
        </form>

        <div className="divider-text">— o continúa con —</div>
        <button type="button" className="google-btn" onClick={handleGoogle} disabled={loading || googleLoading}>{googleLoading ? 'Conectando...' : '🔴 Continuar con Google'}</button>
        <p className="signup-terms">Al continuar aceptas nuestros términos de servicio y política de privacidad.</p>
      </div>
    </section>
  )
}