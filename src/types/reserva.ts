export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada'

export interface ReservaDocument {
  id_reserva: string
  id_usuario: string
  email_usuario: string
  id_producto: string
  fecha_reserva: Date
  cantidad: number
  estado_reserva: EstadoReserva
}
