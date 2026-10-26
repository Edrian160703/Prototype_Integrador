import { Link, NavLink } from 'react-router-dom'
import { useAuthSession, useUserProfile } from '../context/AuthContext'

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/explorar', label: 'Explorar' },
  { to: '/como-funciona', label: '¿Cómo funciona?' },
  { to: '/impacto', label: 'Impacto' },
  { to: '/para-negocios', label: 'Para negocios' },
]

interface HeaderNavigationProps {
  onOpenLogin: () => void
  navOpen: boolean
  onClose: () => void
}

export default function HeaderNavigation({
  onOpenLogin,
  navOpen,
  onClose,
}: HeaderNavigationProps) {
  const { user, loading, isAdmin } = useAuthSession()
  const { profile } = useUserProfile()

  return (
    <>
      <Link className="logo" to="/" onClick={onClose}>
        <span className="logo-mark" aria-hidden="true">♻</span>
        <span>
          <span className="logo-text">FOODBACK</span>
          <small className="logo-tagline">Buena comida, segunda oportunidad</small>
        </span>
      </Link>

      <nav className={`nav${navOpen ? ' open' : ''}`}>
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onClose}
          >
            {link.label}
          </NavLink>
        ))}
        {!loading && profile?.role === 'store' && (
          <NavLink to="/publicar" className="mobile-nav-publish" onClick={onClose}>
            + Publicar una oferta
          </NavLink>
        )}
        {!loading && user && isAdmin && (
          <NavLink to="/admin" className="mobile-nav-admin" onClick={onClose}>
            + Dashboard
          </NavLink>
        )}
        {!loading && !user && (
          <button
            type="button"
            className="mobile-nav-login"
            onClick={() => {
              onClose()
              onOpenLogin()
            }}
          >
            Iniciar sesión
          </button>
        )}
      </nav>

    </>
  )
}
