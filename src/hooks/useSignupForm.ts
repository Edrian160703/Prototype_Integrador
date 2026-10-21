import { useMemo, useState } from 'react'
import { useAuthRegistration } from '../context/ApplicationContext'
import {
  getSignupRoleStrategy,
  USER_SIGNUP_STRATEGIES,
  type SignupRole,
} from '../strategies/userRoleStrategies'
import {
  getPasswordStrength,
  validateSignupForm,
  type SignupFormErrors,
  type SignupFormValues,
} from '../utils/signupForm'

const INITIAL_VALUES: SignupFormValues = { fullName: '', email: '', password: '' }

interface SignupFormOptions {
  onRegistrationComplete: (onboardingPath: string) => void
}

export default function useSignupForm({ onRegistrationComplete }: SignupFormOptions) {
  const { registerWithEmail, signInWithGoogle } = useAuthRegistration()
  const [role, setRole] = useState<SignupRole>('consumer')
  const [values, setValues] = useState<SignupFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const roleStrategy = getSignupRoleStrategy(role)
  const passwordStrength = useMemo(() => getPasswordStrength(values.password), [values.password])

  const updateField = (field: keyof SignupFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const submitWithEmail = async () => {
    const nextErrors = validateSignupForm(values, roleStrategy.presentation.missingNameMessage)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    setAuthError('')
    try {
      await registerWithEmail(
        values.email,
        values.password,
        roleStrategy.userRole,
        roleStrategy.createInitialProfile(values.fullName),
      )
      onRegistrationComplete(roleStrategy.presentation.onboardingPath)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'No pudimos crear tu cuenta.')
    } finally {
      setLoading(false)
    }
  }

  const submitWithGoogle = async () => {
    setGoogleLoading(true)
    setAuthError('')
    try {
      await signInWithGoogle(roleStrategy.userRole)
      onRegistrationComplete(roleStrategy.presentation.onboardingPath)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'No pudimos conectar con Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return {
    role,
    setRole,
    values,
    errors,
    loading,
    googleLoading,
    authError,
    showPassword,
    setShowPassword,
    passwordStrength,
    rolePresentation: roleStrategy.presentation,
    availableRoles: USER_SIGNUP_STRATEGIES.map(({ presentation }) => presentation),
    updateField,
    submitWithEmail,
    submitWithGoogle,
  }
}
