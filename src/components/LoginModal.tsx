import { useState, type FormEvent, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAdminClaimQuery,
  useEmailSignIn,
  useGoogleSignIn,
} from '../context/ApplicationContext'

interface LoginModalProps {
  onClose: () => void
}

type Tab = 'login' | 'register'

export default function LoginModal({ onClose }: LoginModalProps) {
  const { loginWithGoogle } = useGoogleSignIn()
  const { signInWithEmail } = useEmailSignIn()
  const { hasAdminClaim } = useAdminClaimQuery()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('login')
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  async function finishSignIn() {
    try {
      const isAdmin = await hasAdminClaim()
      if (isAdmin) navigate('/admin')
      onClose()
    } catch (error) {
      console.error('No se pudieron verificar los permisos tras iniciar sesión.', error)
      setAuthError(
        'Iniciaste sesión, pero no pudimos verificar tus permisos. Comprueba la conexión e inténtalo de nuevo.',
      )
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError('')
    setLoading(true)
    try {
      await signInWithEmail(email, password)
    } catch (error) {
      setAuthError(error instanceof Error ? 'Correo o contraseña incorrectos.' : 'No pudimos iniciar sesión.')
      setLoading(false)
      return
    }

    await finishSignIn()
    setLoading(false)
  }

  const handleGoogle = async () => {
    setAuthError('')
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
    } catch {
      setAuthError('No pudimos conectar con Google.')
      setGoogleLoading(false)
      return
    }

    await finishSignIn()
    setGoogleLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box">
        <div className="modal-head">
          <div className="logo">
            <span className="logo-mark" aria-hidden="true">♻</span>
            <span>
              <span className="logo-text">FOODBACK</span>
              <small className="logo-tagline">Buena comida, segunda oportunidad</small>
            </span>
          </div>
          <button className="modal-close" aria-label="Cerrar" onClick={onClose}>×</button>
        </div>

        <div className="tabs" role="tablist">
          <button
            type="button"
            className={`tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => setTab('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className="tab"
            onClick={() => {
              navigate('/registro')
              onClose()
            }}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required />
          </div>

          <div className="field">
            <div className="field-label-row">
              <label style={{ marginBottom: 0 }}>Contraseña</label>
              {tab === 'login' && <span className="link-small">¿Olvidaste tu contraseña?</span>}
            </div>
            <div className="password-field">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {authError && <p className="field-error" role="alert">{authError}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || googleLoading}>
            {tab === 'login' ? (loading ? 'Entrando...' : 'Iniciar sesión') : 'Crear cuenta'}
          </button>
        </form>

        <div className="divider-text">— o continúa con —</div>
        <button type="button" className="google-btn" onClick={handleGoogle} disabled={loading || googleLoading}>
          {googleLoading ? 'Conectando...' : '🔴 Continuar con Google'}
        </button>

        <div className="register-line">
          {tab === 'login' ? (
            <>¿No tienes cuenta? <b onClick={() => { onClose(); navigate('/registro') }}>Regístrate gratis</b></>
          ) : (
            <>¿Ya tienes cuenta? <b onClick={() => setTab('login')}>Inicia sesión</b></>
          )}
        </div>
      </div>
    </div>
  )
}
