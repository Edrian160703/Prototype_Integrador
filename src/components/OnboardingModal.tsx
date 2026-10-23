import { Navigate, useParams } from 'react-router-dom'
import ConsumerOnboardingForm from './ConsumerOnboardingForm'
import StoreOnboardingForm from './StoreOnboardingForm'
import useOnboardingSubmission from '../hooks/useOnboardingSubmission'
import { resolveOnboardingRole } from '../strategies/userRoleStrategies'

export default function OnboardingModal() {
  const { role: routeRole } = useParams<{ role: string }>()
  const role = resolveOnboardingRole(routeRole)
  const { submit, goBack, canContinue, loading, error } = useOnboardingSubmission(role)

  if (!role || !canContinue) return <Navigate to="/registro" replace />

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
          <ConsumerOnboardingForm loading={loading} onSubmit={submit} />
        ) : (
          <StoreOnboardingForm loading={loading} onSubmit={submit} />
        )}

        {error && <p className="field-error onboarding-error" role="alert">{error}</p>}

        <button type="button" className="btn btn-ghost btn-block" onClick={() => void goBack()} disabled={loading}>
          Volver al paso 1
        </button>
      </div>
    </div>
  )
}