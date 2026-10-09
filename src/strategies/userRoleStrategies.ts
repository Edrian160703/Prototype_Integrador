import type {
  InitialUserProfile,
  UserRole,
} from '../types/user'

export type SignupRole = 'consumer' | 'business'

export interface UserSignupStrategy {
  readonly signupRole: SignupRole
  readonly userRole: UserRole
  createInitialProfile(fullName: string): InitialUserProfile
}

class ConsumerRoleStrategy implements UserSignupStrategy {
  readonly signupRole = 'consumer' as const
  readonly userRole = 'consumer' as const

  createInitialProfile(fullName: string): InitialUserProfile {
    const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/)
    return { firstName, lastName: lastNameParts.join(' ') }
  }
}

class BusinessRoleStrategy implements UserSignupStrategy {
  readonly signupRole = 'business' as const
  readonly userRole = 'store' as const

  createInitialProfile(): InitialUserProfile {
    return {}
  }
}

export const USER_SIGNUP_STRATEGIES: readonly UserSignupStrategy[] = [
  new ConsumerRoleStrategy(),
  new BusinessRoleStrategy(),
]

export function getSignupRoleStrategy(role: SignupRole): UserSignupStrategy {
  const strategy = USER_SIGNUP_STRATEGIES.find((candidate) => candidate.signupRole === role)
  if (!strategy) throw new Error(`No user role strategy is registered for signup role "${role}".`)
  return strategy
}
