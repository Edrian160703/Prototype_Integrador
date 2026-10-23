import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useCurrentUserQuery,
  usePendingSignupQuery,
  useProfileOnboarding,
  useSignupCompletion,
} from '../context/ApplicationContext'
import { useRefreshUserProfile } from '../context/AuthContext'
import type { ConsumerProfile, StoreProfile, UserRole } from '../types/user'

const SAVE_ERROR_MESSAGE = 'No pudimos guardar tu perfil. Inténtalo nuevamente.'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : SAVE_ERROR_MESSAGE
}

export default function useOnboardingSubmission(role: UserRole | null) {
  const navigate = useNavigate()
  const { getCurrentUser } = useCurrentUserQuery()
  const { getPendingSignupRole } = usePendingSignupQuery()
  const { completeSignup, cancelSignup } = useSignupCompletion()
  const { updateUserProfile } = useProfileOnboarding()
  const { refreshProfile } = useRefreshUserProfile()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pendingRole = getPendingSignupRole()
  const hasPendingSignup = pendingRole !== null
  // Se puede continuar con un registro pendiente del mismo rol, o con una sesión ya existente.
  const canContinue = role !== null && (pendingRole === role || (!hasPendingSignup && getCurrentUser() !== null))

  const submit = async (profileData: ConsumerProfile | StoreProfile) => {
    if (!role) return

    setError('')
    setLoading(true)
    try {
      if (hasPendingSignup) {
        await completeSignup(profileData)
      } else {
        const currentUser = getCurrentUser()
        if (!currentUser) {
          setError('Tu sesión expiró. Regístrate o inicia sesión nuevamente.')
          return
        }
        await updateUserProfile(currentUser.uid, role, profileData)
      }
      await refreshProfile()
      navigate(role === 'store' ? '/registro-negocio' : '/')
    } catch (submissionError) {
      setError(getErrorMessage(submissionError))
    } finally {
      setLoading(false)
    }
  }

  const goBack = async () => {
    await cancelSignup()
    navigate('/registro')
  }

  return { submit, goBack, canContinue, loading, error }
}
