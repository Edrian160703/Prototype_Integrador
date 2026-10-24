import { Timestamp } from 'firebase/firestore'

export function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) return date
  }
  throw new TypeError('El valor de fecha almacenado en Firestore no es válido.')
}

export function toTimestamp(value: Date): Timestamp {
  return Timestamp.fromDate(value)
}
