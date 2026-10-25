import type { IdGenerator } from '../ports/idGenerator'
import type { PaymentCharge, PaymentGateway, PaymentReceipt } from '../ports/paymentGateway'

/** Tarjeta de prueba: la pasarela simulada siempre la rechaza. */
export const DECLINED_TEST_CARD = '4000000000000002'

const SIMULATED_LATENCY_MS = 900

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/**
 * Pasarela de pago simulada: no contacta a ningún proveedor real ni conserva datos de tarjeta.
 * Reemplázala por el adaptador del proveedor real (Culqi, Niubiz, etc.) sin tocar la aplicación.
 */
export class SimulatedPaymentGateway implements PaymentGateway {
  constructor(
    private readonly idGenerator: IdGenerator,
    private readonly latencyMs: number = SIMULATED_LATENCY_MS,
  ) {}

  async charge({ amount, card }: PaymentCharge): Promise<PaymentReceipt> {
    if (!(amount > 0)) throw new Error('El monto a pagar no es válido.')
    await wait(this.latencyMs)
    if (card.number === DECLINED_TEST_CARD) {
      throw new Error('El banco rechazó el pago. Prueba con otra tarjeta.')
    }
    return { reference: `SIM-${this.idGenerator.next()}` }
  }

  async refund(): Promise<void> {
    await wait(this.latencyMs)
  }
}
