export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada'

export interface ReservaDocument {
  id_reserva: string
  id_usuario: string
  email_usuario: string
  id_producto: string
  id_producto_catalogo?: string
  fecha_reserva: Date
  cantidad: number
  estado_reserva: EstadoReserva
}

export interface ReservaConOferta extends ReservaDocument {
  nombre_producto: string
  imagen_url: string | null
  precio_oferta: number
  horario_recojo: string
}
