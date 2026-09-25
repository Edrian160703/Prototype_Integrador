import { NavLink, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import UserMenu from './UserMenu'
import darkModeIcon from '../assets/images/dark-mode-icon.png'

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
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('foodback-theme')
    if (savedTheme) return savedTheme === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const { user, loading } = useAuth()

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    localStorage.setItem('foodback-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

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
        <button
          className={`theme-toggle${darkMode ? ' is-dark' : ''}`}
          type="button"
          aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-pressed={darkMode}
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          onClick={() => setDarkMode((value) => !value)}
        >
          <img src={darkModeIcon} alt="" aria-hidden="true" />
        </button>
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
