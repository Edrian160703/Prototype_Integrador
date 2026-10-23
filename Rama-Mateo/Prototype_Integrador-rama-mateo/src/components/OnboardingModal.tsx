import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useCurrentUserQuery, useProfileOnboarding } from '../context/ApplicationContext'
import ConsumerOnboardingForm from './ConsumerOnboardingForm'
import StoreOnboardingForm from './StoreOnboardingForm'
import type { ConsumerProfile, StoreProfile } from '../types/user'
import { resolveOnboardingRole } from '../strategies/userRoleStrategies'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos guardar tu perfil. Inténtalo nuevamente.'
}

export default function OnboardingModal() {
  const { getCurrentUser } = useCurrentUserQuery()
  const { updateUserProfile } = useProfileOnboarding()
  const navigate = useNavigate()
  const { role: routeRole } = useParams<{ role: string }>()
  const role = resolveOnboardingRole(routeRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleProfileSubmit = async (profileData: ConsumerProfile | StoreProfile) => {
    if (!role) return

    setError('')
    const currentUser = getCurrentUser()

    if (!currentUser) {
      setError('Tu sesión expiró. Regístrate o inicia sesión nuevamente.')
      return
    }

    setLoading(true)

    try {
      await updateUserProfile(currentUser.uid, role, profileData)
      navigate(role === 'store' ? '/registro-negocio' : '/')
    } catch (submissionError) {
      setError(getErrorMessage(submissionError))
    } finally {
      setLoading(false)
    }
  }

  if (!role) return <Navigate to="/registro" replace />

  return (
    <div className="modal-overlay onboarding-overlay">
      <div
        className="modal-box onboarding-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="modal-head">
          <div>
            <span className="signup-kicker">Paso 2 de tu registro</span>
            <h1 id="onboarding-title">
              {role === 'consumer' ? 'Cuéntanos qué buscas' : 'Completa tu comercio'}
            </h1>
          </div>
          <span className="onboarding-step" aria-label="Paso 2 de 2">
            2/2
          </span>
        </div>
        <p className="onboarding-intro">
          Estos datos nos ayudan a conectar mejor las ofertas con tu zona en San Juan de Lurigancho.
        </p>

        {role === 'consumer' ? (
          <ConsumerOnboardingForm loading={loading} onSubmit={handleProfileSubmit} />
        ) : (
          <StoreOnboardingForm loading={loading} onSubmit={handleProfileSubmit} />
        )}

        {error && <p className="field-error onboarding-error" role="alert">{error}</p>}
      </div>
    </div>
  )
}