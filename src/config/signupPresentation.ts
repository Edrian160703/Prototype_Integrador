import type { SignupRole } from '../strategies/userRoleStrategies'

export interface SignupPresentation {
  signupRole: SignupRole
  title: string
  description: string
  icon: string
  nameLabel: string
  namePlaceholder: string
  missingNameMessage: string
  onboardingPath: string
}

export const SIGNUP_PRESENTATION: readonly SignupPresentation[] = [
  {
    signupRole: 'consumer',
    title: 'Consumidor',
    description: 'Encuentra ofertas cerca de ti',
    icon: '🛒',
    nameLabel: 'Nombre completo',
    namePlaceholder: 'Ej. Ana García',
    missingNameMessage: 'Ingresa tu nombre completo.',
    onboardingPath: '/onboarding/consumidor',
  },
  {
    signupRole: 'business',
    title: 'Comercio',
    description: 'Publica tus excedentes',
    icon: '🏪',
    nameLabel: 'Nombre del representante',
    namePlaceholder: 'Ej. Ana García, representante',
    missingNameMessage: 'Ingresa el nombre del representante.',
    onboardingPath: '/onboarding/comercio',
  },
]
