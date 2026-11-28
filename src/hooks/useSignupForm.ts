import { useMemo, useState } from 'react'
import { useSignupStart } from '../context/ApplicationContext'
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
  onStepCompleted: (onboardingPath: string) => void
}

export default function useSignupForm({ onStepCompleted }: SignupFormOptions) {
  const { startEmailSignup, startGoogleSignup } = useSignupStart()
  const [role, setRole] = useState<SignupRole>('consumer')
  const [values, setValues] = useState<SignupFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<SignupFormErrors>({})
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const roleStrategy = getSignupRoleStrategy(role)
  const passwordStrength = useMemo(() => getPasswordStrength(values.password), [values.password])

  const updateField = (field: keyof SignupFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  // Paso 1: solo valida y recuerda los datos en memoria. La cuenta se crea al terminar el paso 2.
  const submitWithEmail = () => {
    const nextErrors = validateSignupForm(values, roleStrategy.presentation.missingNameMessage)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setAuthError('')
    startEmailSignup({
      email: values.email,
      password: values.password,
      role: roleStrategy.userRole,
      profile: roleStrategy.createInitialProfile(values.fullName),
    })
    onStepCompleted(roleStrategy.presentation.onboardingPath)
  }

  const submitWithGoogle = async () => {
    setGoogleLoading(true)
    setAuthError('')
    try {
      await startGoogleSignup(roleStrategy.userRole)
      onStepCompleted(roleStrategy.presentation.onboardingPath)
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
