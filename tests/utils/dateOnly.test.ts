import { describe, expect, it } from 'vitest'
import { isValidDateOnly, sameCalendarDate } from '../../src/utils/dateOnly'

describe('date-only comparison', () => {
  it('validates real calendar dates and compares them as UTC calendar days', () => {
    expect(isValidDateOnly('2028-02-29')).toBe(true)
    expect(isValidDateOnly('2027-02-29')).toBe(false)
    expect(sameCalendarDate('2028-02-29', '2028-02-29')).toBe(true)
    expect(sameCalendarDate('2028-02-29', '2028-03-01')).toBe(false)
    expect(sameCalendarDate('2028-02-30', '2028-02-30')).toBe(false)
  })
})
