import type { CheckoutCustomer, EstadoPago, MetodoPago } from './checkout'

/** Una línea de la compra: apunta a la reserva que se creó para ese producto. */
export interface CompraItem {
  id_reserva: string
  id_oferta: string
  nombre_producto: string
  comercio: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

/** Lo que la capa de aplicación entrega para registrar una compra ya confirmada. */
export interface NuevaCompra {
  idUsuario: string
  emailUsuario: string
  /** Se usa para armar el ID legible: COMPRA_<nombre>_<id>. */
  nombreUsuario?: string | null
  customer: CheckoutCustomer
  metodoPago: MetodoPago
  estadoPago: EstadoPago
  referenciaPago?: string
  total: number
  items: CompraItem[]
}
