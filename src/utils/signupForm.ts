export interface SignupFormValues {
  fullName: string
  email: string
  password: string
}

export type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>

export interface PasswordStrength {
  score: number
  label: string
}

export function validateSignupForm(
  values: SignupFormValues,
  missingNameMessage: string,
): SignupFormErrors {
  const errors: SignupFormErrors = {}

  if (!values.fullName.trim()) errors.fullName = missingNameMessage
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Ingresa un correo electrónico válido.'
  }
  if (values.password.length < 8) errors.password = 'Usa al menos 8 caracteres.'

  return errors
}

export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte']
  return { score, label: labels[score] }
}
