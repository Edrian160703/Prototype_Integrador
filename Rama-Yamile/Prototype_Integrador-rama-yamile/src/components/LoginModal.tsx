import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithGoogle, signInWithEmail } from '../services/authService'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

type Tab = 'login' | 'register'

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('login')
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!open) {
      setTab('login')
      setShowPass(false)
      setEmail('')
      setPassword('')
      setAuthError('')
    }
  }, [open])

  if (!open) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError('')
    setLoading(true)
    signInWithEmail(email, password)
      .then(() => onClose())
      .catch((error: unknown) => {
        setAuthError(error instanceof Error ? 'Correo o contraseña incorrectos.' : 'No pudimos iniciar sesión.')
      })
      .finally(() => setLoading(false))
  }

  const handleGoogle = () => {
    setAuthError('')
    setGoogleLoading(true)
    loginWithGoogle()
      .then(() => onClose())
      .catch(() => setAuthError('No pudimos conectar con Google.'))
      .finally(() => setGoogleLoading(false))
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
