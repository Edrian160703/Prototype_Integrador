import type {
  InitialUserProfile,
  UserRole,
} from '../types/user'

export type SignupRole = 'consumer' | 'business'

export function resolveOnboardingRole(segment: unknown): UserRole | null {
  switch (segment) {
    case 'consumer':
    case 'consumidor':
      return 'consumer'
    case 'store':
    case 'comercio':
      return 'store'
    default:
      return null
  }
}

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

export interface UserSignupStrategy {
  readonly signupRole: SignupRole
  readonly userRole: UserRole
  readonly presentation: SignupPresentation
  createInitialProfile(fullName: string): InitialUserProfile
}

class ConsumerRoleStrategy implements UserSignupStrategy {
  readonly signupRole = 'consumer' as const
  readonly userRole = 'consumer' as const
  readonly presentation: SignupPresentation = {
    signupRole: 'consumer',
    title: 'Consumidor',
    description: 'Encuentra ofertas cerca de ti',
    icon: '🛒',
    nameLabel: 'Nombre completo',
    namePlaceholder: 'Ej. Ana García',
    missingNameMessage: 'Ingresa tu nombre completo.',
    onboardingPath: '/onboarding/consumidor',
  }

  createInitialProfile(fullName: string): InitialUserProfile {
    const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/)
    return { firstName, lastName: lastNameParts.join(' ') }
  }
}

class BusinessRoleStrategy implements UserSignupStrategy {
  readonly signupRole = 'business' as const
  readonly userRole = 'store' as const
  readonly presentation: SignupPresentation = {
    signupRole: 'business',
    title: 'Comercio',
    description: 'Publica tus excedentes',
    icon: '🏪',
    nameLabel: 'Nombre del representante',
    namePlaceholder: 'Ej. Ana García, representante',
    missingNameMessage: 'Ingresa el nombre del representante.',
    onboardingPath: '/onboarding/comercio',
  }

  createInitialProfile(): InitialUserProfile {
    return {}
  }
}

export const USER_SIGNUP_STRATEGIES: readonly UserSignupStrategy[] = [
  new ConsumerRoleStrategy(),
  new BusinessRoleStrategy(),
]

const signupStrategiesByRole = new Map(
  USER_SIGNUP_STRATEGIES.map((strategy) => [strategy.signupRole, strategy]),
)

export function getSignupRoleStrategy(role: SignupRole): UserSignupStrategy {
  const strategy = signupStrategiesByRole.get(role)
  if (!strategy) throw new Error(`No user role strategy is registered for signup role "${role}".`)
  return strategy
}
