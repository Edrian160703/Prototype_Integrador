import { DNI_LENGTH } from '../validation/dni'

export const DNI_VISIBLE_DIGITS = 3
const MASK_CHARACTER = '*'

/**
 * Oculta un DNI para mostrarlo en pantalla: deja visibles los primeros dígitos
 * y reemplaza el resto por asteriscos (p. ej. "12345678" -> "123*****").
 * Devuelve cadena vacía si no hay DNI registrado.
 */
export function maskDni(dni?: string | null): string {
  const digits = (dni ?? '').replace(/\D/g, '').slice(0, DNI_LENGTH)
  if (!digits) return ''

  const visible = digits.slice(0, DNI_VISIBLE_DIGITS)
  return visible + MASK_CHARACTER.repeat(DNI_LENGTH - visible.length)
}
