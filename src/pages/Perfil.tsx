import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileConsumerForm from '../components/ProfileConsumerForm'
import ProfileStoreForm from '../components/ProfileStoreForm'
import MisReservas from '../components/MisReservas'
import MisPublicaciones from '../components/MisPublicaciones'
import '../styles/perfil.css'

export default function Perfil() {
  const { user, profile, loading, refreshProfile } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/" replace />

  if (!profile) {
    return (
      <section className="profile-page">
        <div className="profile-section profile-empty">
          <h1>No encontramos tu perfil</h1>
          <p>Cierra sesión e inicia nuevamente. Si el problema continúa, completa tu registro otra vez.</p>
        </div>
      </section>
    )
  }

  const isStore = profile.role === 'store'
  const displayName = profile.displayName || user.displayName || 'Usuario'
  const photoURL = profile.photoURL || user.photoURL
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U'

  return (
    <section className="profile-page">
      <header className="profile-hero">
        {photoURL ? (
          <img src={photoURL} alt={displayName} className="profile-avatar" referrerPolicy="no-referrer" />
        ) : (
          <span className="profile-avatar" aria-hidden="true">{initials}</span>
        )}
        <div className="profile-hero-copy">
          <span className="signup-kicker">Mi perfil</span>
          <h1>{displayName}</h1>
          <p>{isStore ? 'Personaliza los datos de tu comercio.' : 'Personaliza tu cuenta y tus preferencias.'}</p>
          <span className={`account-type-badge${isStore ? ' account-type-badge-store' : ''}`}>
            <span aria-hidden="true">{isStore ? '🏪' : '🛒'}</span>
            {isStore ? 'Comercio' : 'Consumidor'}
          </span>
        </div>
      </header>

      {profile.role === 'store' ? (
        <>
          <ProfileStoreForm profile={profile} onSaved={refreshProfile} />
          <MisPublicaciones uid={user.uid} />
        </>
      ) : (
        <>
          <ProfileConsumerForm profile={profile} onSaved={refreshProfile} />
          <MisReservas idUsuario={user.uid} />
        </>
      )}
    </section>
  )
}
