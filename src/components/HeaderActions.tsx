import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthSession, useUserProfile } from '../context/AuthContext'
import { useReservationHistory } from '../context/ApplicationContext'
import UserMenu from './UserMenu'
import darkModeIcon from '../assets/images/dark-mode-icon.png'
import useThemePreference from '../hooks/useThemePreference'

interface HeaderActionsProps {
  onOpenLogin: () => void
  navOpen: boolean
  onToggleNavigation: () => void
}

export default function HeaderActions({
  onOpenLogin,
  navOpen,
  onToggleNavigation,
}: HeaderActionsProps) {

  const { user, loading, isAdmin } = useAuthSession()
  const { profile } = useUserProfile()
  const { getReservasByUsuario } = useReservationHistory()
  const { darkMode, toggleTheme } = useThemePreference()
  const { pathname } = useLocation()
  const [pendingReservations, setPendingReservations] = useState<{
    userId: string
    hasPending: boolean
  } | null>(null)

  useEffect(() => {
    if (loading || !user || profile?.role !== 'consumer') {
      setPendingReservations(null)
      return
    }

    let cancelled = false
    setPendingReservations(null)

    void getReservasByUsuario(user.uid)
      .then((reservas) => {
        if (!cancelled) {
          setPendingReservations({
            userId: user.uid,
            hasPending: reservas.some((reserva) => reserva.estado_reserva === 'pendiente'),
          })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error('No se pudieron consultar las reservas pendientes.', error)
        }
      })

    return () => {
      cancelled = true
    }
  }, [getReservasByUsuario, loading, pathname, profile?.role, user?.uid])

  return (
    <div className="header-right">
      {!loading && profile?.role === 'store' && (
        <Link to="/publicar" className="btn btn-publish">+ Publicar</Link>
      )}
      {!loading && profile?.role === 'consumer' && user &&
        pendingReservations?.userId === user.uid && pendingReservations.hasPending && (
          <Link to="/perfil#reservas" className="btn btn-publish btn-pending-reservations">
            Reservas Pendientes
          </Link>
        )}
      
      {!loading && isAdmin && (
        <Link to="/admin" className="btn btn-publish">Dashboard</Link>
      )}
      <span className="location-pill"> Lima, Perú</span>
      <button className="icon-btn" aria-label="Favoritos">♡</button>
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
        className={`theme-toggle${darkMode ? ' is-dark' : ''}`}
        type="button"
        aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-pressed={darkMode}
        title={darkMode ? 'Modo claro' : 'Modo oscuro'}
        onClick={toggleTheme}
      >
        <img src={darkModeIcon} alt="" aria-hidden="true" />
      </button>
      <button
        className="nav-toggle"
        type="button"
        aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={navOpen}
        onClick={onToggleNavigation}
      >
        ☰
      </button>
    </div>
  )
}
