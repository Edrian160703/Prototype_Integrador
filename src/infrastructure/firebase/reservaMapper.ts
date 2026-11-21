import type { EstadoReserva, ReservaDocument } from '../../types/reserva'
import { toDate } from './firestoreDates'

const RESERVATION_STATES: readonly EstadoReserva[] = ['pendiente', 'confirmada', 'cancelada']

export function isReservationState(value: unknown): value is EstadoReserva {
  return typeof value === 'string' && RESERVATION_STATES.includes(value as EstadoReserva)
}

export function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === code
}

export function mapReservation(documentId: string, data: Record<string, unknown>): ReservaDocument {
  const status = data.estado_reserva
  if (!isReservationState(status)) {
    throw new TypeError(`El estado de la reserva ${documentId} no es válido.`)
  }

  const quantity = data.cantidad
  if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new TypeError(`La cantidad de la reserva ${documentId} no es válida.`)
  }

  const productId = data.id_producto_catalogo
  return {
    id_reserva: typeof data.id_reserva === 'string' ? data.id_reserva : documentId,
    id_usuario: typeof data.id_usuario === 'string' ? data.id_usuario : '',
    email_usuario: typeof data.email_usuario === 'string' ? data.email_usuario : '',
    id_producto: typeof data.id_producto === 'string' ? data.id_producto : '',
    ...(typeof productId === 'string' && productId ? { id_producto_catalogo: productId } : {}),
    fecha_reserva: toDate(data.fecha_reserva),
    cantidad: quantity,
    estado_reserva: status,
  }
}
