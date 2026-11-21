import type { CardDetails } from '../types/checkout'

export interface PaymentCharge {
  /** Monto total en soles. */
  amount: number
  card: CardDetails
}

export interface PaymentReceipt {
  /** Identificador de la transacción en la pasarela. */
  reference: string
}

export interface PaymentCharger {
  charge(request: PaymentCharge): Promise<PaymentReceipt>
}

export interface PaymentRefunder {
  refund(reference: string): Promise<void>
}

export interface PaymentGateway extends PaymentCharger, PaymentRefunder {}
