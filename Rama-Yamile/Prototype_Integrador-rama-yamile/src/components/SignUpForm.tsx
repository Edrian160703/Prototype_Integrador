import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerWithEmail, signInWithGoogle } from '../services/authService'

type UserRole = 'consumer' | 'business'

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
  const [role, setRole] = useState<UserRole>('consumer')
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const passwordStrength = useMemo(() => getPasswordStrength(values.password), [values.password])

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.fullName.trim()) nextErrors.fullName = role === 'consumer' ? 'Ingresa tu nombre completo.' : 'Ingresa el nombre del representante.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = 'Ingresa un correo electrónico válido.'
    if (values.password.length < 8) nextErrors.password = 'Usa al menos 8 caracteres.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const redirectToOnboarding = () => {
    navigate(role === 'consumer' ? '/onboarding/consumidor' : '/onboarding/comercio')
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    setAuthError('')
    const [firstName, ...lastNameParts] = values.fullName.trim().split(/\s+/)
    const lastName = lastNameParts.join(' ')
    const firebaseRole = role === 'consumer' ? 'consumer' : 'store'
    const profile = role === 'consumer' ? { firstName, lastName } : {}

    registerWithEmail(values.email, values.password, firebaseRole, profile)
      .then(redirectToOnboarding)
      .catch((error: unknown) => {
        setAuthError(error instanceof Error ? error.message : 'No pudimos crear tu cuenta.')
      })
      .finally(() => setLoading(false))
  }

  const handleGoogle = () => {
    setGoogleLoading(true)
    setAuthError('')
    const firebaseRole = role === 'consumer' ? 'consumer' : 'store'

    signInWithGoogle(firebaseRole)
      .then(redirectToOnboarding)
      .catch((error: unknown) => {
        setAuthError(error instanceof Error ? error.message : 'No pudimos conectar con Google.')
      })
      .finally(() => setGoogleLoading(false))
  }

  const nameLabel = role === 'consumer' ? 'Nombre completo' : 'Nombre del representante'

  return (
    <section className="signup-page">
      <div className="signup-card">
        <div className="signup-intro">
          <span className="signup-kicker">Únete a Foodback</span>
          <h1>Crea tu cuenta</h1>
          <p>Elige cómo quieres participar y empieza a darle una segunda oportunidad a la comida.</p>
        </div>

        <div className="role-selector" aria-label="Selecciona tu rol">
          <button type="button" className={`role-card${role === 'consumer' ? ' selected' : ''}`} onClick={() => setRole('consumer')} aria-pressed={role === 'consumer'}>
            <span className="role-icon" aria-hidden="true">🛒</span>
            <span><strong>Consumidor</strong><small>Encuentra ofertas cerca de ti</small></span>
            <span className="role-check" aria-hidden="true">{role === 'consumer' ? '✓' : ''}</span>
          </button>
          <button type="button" className={`role-card${role === 'business' ? ' selected' : ''}`} onClick={() => setRole('business')} aria-pressed={role === 'business'}>
            <span className="role-icon" aria-hidden="true">🏪</span>
            <span><strong>Comercio</strong><small>Publica tus excedentes</small></span>
            <span className="role-check" aria-hidden="true">{role === 'business' ? '✓' : ''}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="signup-name">{nameLabel}</label>
            <input id="signup-name" value={values.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder={role === 'consumer' ? 'Ej. Ana García' : 'Ej. Ana García, representante'} aria-invalid={Boolean(errors.fullName)} />
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