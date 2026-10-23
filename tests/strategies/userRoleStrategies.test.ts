import { describe, expect, it } from 'vitest'
import {
  getSignupRoleStrategy,
  resolveOnboardingRole,
  USER_SIGNUP_STRATEGIES,
} from '../../src/strategies/userRoleStrategies'
import { SIGNUP_PRESENTATION } from '../../src/config/signupPresentation'

describe('user signup strategies', () => {
  it('keeps every registered strategy and presentation available from one registry', () => {
    expect(SIGNUP_PRESENTATION).toEqual(
      USER_SIGNUP_STRATEGIES.map(({ presentation }) => presentation),
    )
    expect(USER_SIGNUP_STRATEGIES.map(({ signupRole }) => signupRole))
      .toEqual(['consumer', 'business'])
  })

  it('maps signup roles to application roles and initial profiles', () => {
    const consumer = getSignupRoleStrategy('consumer')
    const business = getSignupRoleStrategy('business')

    expect(consumer.userRole).toBe('consumer')
    expect(consumer.createInitialProfile(' Ana García ')).toEqual({
      firstName: 'Ana',
      lastName: 'García',
    })
    expect(business.userRole).toBe('store')
    expect(business.createInitialProfile('Representante')).toEqual({})
  })

  it.each([
    ['consumer', 'consumer'],
    ['consumidor', 'consumer'],
    ['store', 'store'],
    ['comercio', 'store'],
  ] as const)('resolves onboarding segment "%s"', (segment, role) => {
    expect(resolveOnboardingRole(segment)).toBe(role)
  })

  it.each([undefined, null, '', 'admin', 42, {}])(
    'rejects invalid onboarding segment %s',
    (segment) => {
      expect(resolveOnboardingRole(segment)).toBeNull()
    },
  )
})
