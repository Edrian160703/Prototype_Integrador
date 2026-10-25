export const PHONE_LENGTH = 9
export const PHONE_COUNTRY_CODE = '+51'

const COUNTRY_DIGITS = PHONE_COUNTRY_CODE.replace(/\D/g, '')

export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, PHONE_LENGTH)
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  const hasCountryCode = digits.length === PHONE_LENGTH + COUNTRY_DIGITS.length && digits.startsWith(COUNTRY_DIGITS)
  return sanitizePhone(hasCountryCode ? digits.slice(COUNTRY_DIGITS.length) : digits)
}

export function isValidPhone(value: string): boolean {
  return new RegExp(`^\\d{${PHONE_LENGTH}}$`).test(value)
}
