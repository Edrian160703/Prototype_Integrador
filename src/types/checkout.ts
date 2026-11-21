export type MetodoPago = 'tienda' | 'online'

export type EstadoPago = 'PENDIENTE_PAGO_TIENDA' | 'PAGADO'

export interface CheckoutCustomer {
  nombre: string
  dni: string
  telefono: string
}

export interface CardDetails {
  number: string
  expiry: string
  cvv: string
}

export interface CheckoutFormValues extends CheckoutCustomer {
  metodoPago: MetodoPago
  card: CardDetails
}

/** Lo que la capa de aplicación necesita para confirmar un checkout. */
export interface CheckoutRequest {
  customer: CheckoutCustomer
  metodoPago: MetodoPago
  /** Solo para pago online. Nunca se guarda: únicamente viaja a la pasarela de pago. */
  card?: CardDetails
}

/** Datos del cliente y del pago que se guardan en cada reserva. Nunca incluyen datos de tarjeta. */
export interface ReservaCheckoutDetails {
  nombre_cliente: string
  dni_cliente: string
  telefono_cliente: string
  metodo_pago: MetodoPago
  estado_pago: EstadoPago
  referencia_pago?: string
}
