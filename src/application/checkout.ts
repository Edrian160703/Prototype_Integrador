import type { CompraRecorder } from '../ports/compraRepository'
import type { PaymentGateway } from '../ports/paymentGateway'
import type { ReservaCreator, ReservaDeleter } from '../ports/reservaRepository'
import type { CartItem } from '../types/cart'
import type { CheckoutRequest, ReservaCheckoutDetails } from '../types/checkout'
import { validateCheckout } from '../validation/checkout'

type CheckoutReservations = ReservaCreator & ReservaDeleter

function totalDelCarrito(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

/**
 * Confirma el checkout del carrito:
 *  - "tienda": crea las reservas con estado de pago PENDIENTE_PAGO_TIENDA.
 *  - "online": cobra primero y crea las reservas con estado de pago PAGADO.
 * En ambos casos guarda el DNI del cliente en cada reserva.
 *
 * Si recibe un `purchases`, deja además el registro de la compra (COMPRA_<nombre>_<id>) que agrupa
 * las reservas del checkout. Si ese registro falla se deshace todo igual que si fallara una reserva.
 *
 * El estado de pago se escribe al crear la reserva (las reglas de Firestore no permiten
 * que el cliente lo cambie después), por eso el cobro va antes. Si algo falla al reservar,
 * se cancelan las reservas ya creadas y se reembolsa el cobro.
 */
export async function confirmarCheckout(
  reservations: CheckoutReservations,
  payments: PaymentGateway,
  idUsuario: string,
  emailUsuario: string,
  items: CartItem[],
  request: CheckoutRequest,
  nombreUsuario?: string | null,
  purchases?: CompraRecorder,
): Promise<string[]> {
  if (items.length === 0) throw new Error('Tu carrito está vacío.')

  const { customer, metodoPago, card } = request
  const errors = validateCheckout({
    ...customer,
    metodoPago,
    card: card ?? { number: '', expiry: '', cvv: '' },
  })
  const firstError = Object.values(errors)[0]
  if (firstError) throw new Error(firstError)

  let details: ReservaCheckoutDetails = {
    nombre_cliente: customer.nombre.trim(),
    dni_cliente: customer.dni,
    telefono_cliente: customer.telefono,
    metodo_pago: metodoPago,
    estado_pago: 'PENDIENTE_PAGO_TIENDA',
  }

  let paymentReference: string | null = null
  if (metodoPago === 'online') {
    if (!card) throw new Error('Ingresa los datos de tu tarjeta.')
    const receipt = await payments.charge({ amount: totalDelCarrito(items), card })
    paymentReference = receipt.reference
    details = { ...details, estado_pago: 'PAGADO', referencia_pago: receipt.reference }
  }

  const reservationIds: string[] = []
  try {
    for (const item of items) {
      reservationIds.push(
        await reservations.create(idUsuario, emailUsuario, item, nombreUsuario, details),
      )
    }
    await purchases?.record({
      idUsuario,
      emailUsuario,
      nombreUsuario,
      customer: { ...customer, nombre: customer.nombre.trim() },
      metodoPago,
      estadoPago: details.estado_pago,
      referenciaPago: details.referencia_pago,
      total: totalDelCarrito(items),
      items: items.map((item, index) => ({
        id_reserva: reservationIds[index],
        id_oferta: item.id,
        nombre_producto: item.title,
        comercio: item.place,
        cantidad: item.quantity,
        precio_unitario: item.price,
        subtotal: item.price * item.quantity,
      })),
    })
  } catch (error) {
    await Promise.allSettled(reservationIds.map((id) => reservations.delete(id)))
    if (paymentReference) await payments.refund(paymentReference).catch(() => undefined)
    throw error
  }

  return reservationIds
}
