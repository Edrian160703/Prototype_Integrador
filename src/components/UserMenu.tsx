import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signOutUser } from '../services/authService'

export default function UserMenu() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const displayName = profile?.displayName || user.displayName || 'Usuario'
  const photoURL = profile?.photoURL || user.photoURL
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'U'

  const isStore = profile?.role === 'store'
  const accountTypeLabel = isStore ? 'Comercio' : 'Consumidor'
  const accountTypeIcon = isStore ? '🏪' : '🛒'

  const handleSignOut = async () => {
    setOpen(false)
    await signOutUser()
    navigate('/')
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-avatar-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menú de perfil"
      >
        {photoURL ? (
          <img src={photoURL} alt={displayName} className="user-avatar" />
        ) : (
          <span className="user-avatar user-avatar-fallback">{initials}</span>
        )}
      </button>

      <div className={`user-dropdown${open ? '' : ' hidden'}`}>
        <div className="user-dropdown-header">
          <p className="user-dropdown-name">{displayName}</p>
          {user.email && <p className="user-dropdown-email">{user.email}</p>}
          {profile && (
            <span className={`account-type-badge${isStore ? ' account-type-badge-store' : ''}`}>
              <span aria-hidden="true">{accountTypeIcon}</span>
              {accountTypeLabel}
            </span>
          )}
        </div>

        <Link to="/perfil" className="user-dropdown-item" onClick={() => setOpen(false)}>
          <span className="user-dropdown-item-icon" aria-hidden="true">⚙</span>
          Mi Perfil / Personalizar
        </Link>

        <div className="user-dropdown-divider" role="separator" />

        <button type="button" className="user-dropdown-item user-dropdown-item-danger" onClick={handleSignOut}>
          <span className="user-dropdown-item-icon" aria-hidden="true">⏻</span>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
