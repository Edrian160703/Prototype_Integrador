import { useState, useEffect } from 'react'

interface LoginModalProps {
  open: boolean
  onClose: () => void
}

type Tab = 'login' | 'register'

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [tab, setTab] = useState<Tab>('login')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (!open) {
      setTab('login')
      setShowPass(false)
    }
  }, [open])

  if (!open) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onClose()
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

        <div className="tabs">
          <div
            className={`tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => setTab('login')}
          >
            Iniciar sesión
          </div>
          <div
            className={`tab${tab === 'register' ? ' active' : ''}`}
            onClick={() => setTab('register')}
          >
            Registrarse
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Correo electrónico</label>
            <input type="email" placeholder="tu@correo.com" required />
          </div>

          <div className="field">
            <div className="field-label-row">
              <label style={{ marginBottom: 0 }}>Contraseña</label>
              {tab === 'login' && <span className="link-small">¿Olvidaste tu contraseña?</span>}
            </div>
            <div className="password-field">
              <input type={showPass ? 'text' : 'password'} placeholder="••••••••" required />
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

          <button type="submit" className="btn btn-primary btn-block">
            {tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <div className="divider-text">— o continúa con —</div>
        <button type="button" className="google-btn">🔴 Continuar con Google</button>

        <div className="register-line">
          {tab === 'login' ? (
            <>¿No tienes cuenta? <b onClick={() => setTab('register')}>Regístrate gratis</b></>
          ) : (
            <>¿Ya tienes cuenta? <b onClick={() => setTab('login')}>Inicia sesión</b></>
          )}
        </div>
      </div>
    </div>
  )
}
