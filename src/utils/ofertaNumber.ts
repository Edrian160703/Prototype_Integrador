export function isValidDecimal(value: string): boolean {
  return /^\d{1,8}(\.\d{1,2})?$/.test(value.trim())
}

export function normalizeDecimalOnBlur(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || !isValidDecimal(trimmed)) return trimmed
  return Number(trimmed).toFixed(2)
}
