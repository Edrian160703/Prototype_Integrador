import {
  USER_SIGNUP_STRATEGIES,
  type SignupPresentation,
} from '../strategies/userRoleStrategies'

export type { SignupPresentation } from '../strategies/userRoleStrategies'

export const SIGNUP_PRESENTATION: readonly SignupPresentation[] =
  USER_SIGNUP_STRATEGIES.map(({ presentation }) => presentation)
