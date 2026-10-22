
import { NavLink, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import UserMenu from './UserMenu'
import CartPanel from './CartPanel'

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
  const { user, profile, loading } = useAuth()
  const isComercio = profile?.role === 'store'
  const { totalItems } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

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
    <>
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
          {!loading && isComercio && (
            <Link to="/publicar" className="btn btn-publish">
              + Publicar
            </Link>
          )}
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
            {darkMode ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.98 13.02A9 9 0 0 1 10.98 3.02 9 9 0 1 0 20.98 13.02Z" />
              </svg>
            )}
          </button>
          {!loading && (
            user ? (
              <UserMenu />
            ) : (
              <button className="btn btn-primary" onClick={onOpenLogin}>
                Iniciar sesión
              </button>
            )
          )}
          <button
            className="nav-toggle"
            aria-label="Abrir menú"
            onClick={() => setNavOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </header>

      {!isComercio && (
        <button
          className="cart-fab"
          aria-label="Carrito de compras"
          onClick={() => setCartOpen(true)}
        >
          🛒
          {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
        </button>
      )}

      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
