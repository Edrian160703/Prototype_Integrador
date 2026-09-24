import { NavLink, Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import UserMenu from './UserMenu'

interface HeaderProps {
  onOpenLogin: () => void
}

interface NavLinkItem {
  to: string
  label: string
  end?: boolean
}

export default function Header({ onOpenLogin }: HeaderProps) {
  const [navOpen, setNavOpen] = useState(false)
  const { user, loading } = useAuth()

  const links: NavLinkItem[] = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/explorar', label: 'Explorar' },
    { to: '/como-funciona', label: '¿Cómo funciona?' },
    { to: '/impacto', label: 'Impacto' },
    { to: '/para-negocios', label: 'Para negocios' },
  ]

  return (
    <header className="header container">
      <Link className="logo" to="/" onClick={() => setNavOpen(false)}>
        <span className="logo-mark" aria-hidden="true">♻</span>
        <span>
          <span className="logo-text">FOODBACK</span>
          <small className="logo-tagline">Buena comida, segunda oportunidad</small>
        </span>
      </Link>

      <nav className={`nav${navOpen ? ' open' : ''}`}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={() => setNavOpen(false)}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="header-right">
        <span className="location-pill"> Lima, Perú</span>
        <button className="icon-btn" aria-label="Favoritos">♡</button>
        {!loading && (user ? <UserMenu /> : <button className="btn btn-primary" onClick={onOpenLogin}>Iniciar sesión</button>)}
        <button
          className="nav-toggle"
          aria-label="Abrir menú"
          onClick={() => setNavOpen((v) => !v)}
        >
          ☰
        </button>
      </div>
    </header>
  )
}
