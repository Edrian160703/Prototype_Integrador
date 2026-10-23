export const DNI_LENGTH = 8

export function sanitizeDni(value: string): string {
  return value.replace(/\D/g, '').slice(0, DNI_LENGTH)
}

export function isValidDni(value: string): boolean {
  return new RegExp(`^\\d{${DNI_LENGTH}}$`).test(value)
}
