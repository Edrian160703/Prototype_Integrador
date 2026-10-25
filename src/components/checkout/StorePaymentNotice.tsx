import type { CartItem } from '../../types/cart'
import { maskDni } from '../../utils/dniMask'

interface StorePaymentNoticeProps {
  dni: string
  total: number
  items: CartItem[]
}

interface PickupLocation {
  place: string
  address?: string
  reference?: string
}

/** Un local por tarjeta, aunque el carrito tenga varios productos del mismo comercio. */
function uniqueLocations(items: CartItem[]): PickupLocation[] {
  const byKey = new Map<string, PickupLocation>()
  for (const { place, address, reference } of items) {
    const key = `${place}|${address ?? ''}|${reference ?? ''}`
    if (!byKey.has(key)) byKey.set(key, { place, address, reference })
  }
  return [...byKey.values()]
}

export default function StorePaymentNotice({ dni, total, items }: StorePaymentNoticeProps) {
  const maskedDni = maskDni(dni)
  const locations = uniqueLocations(items)

  return (
    <div className="checkout-notice" role="note">
      <strong>Pagarás S/ {total.toFixed(2)} al recoger tu pedido.</strong>
      <p>
        Presenta tu DNI en la tienda para validar tu identidad
        {maskedDni ? <> (reserva registrada con el DNI <b>{maskedDni}</b>)</> : null}.
        Tu reserva quedará pendiente de pago hasta entonces.
      </p>

      {locations.length > 0 && (
        <div className="checkout-pickup">
          <strong>{locations.length > 1 ? 'Dónde recoger tus pedidos' : 'Dónde recoger tu pedido'}</strong>
          <ul>
            {locations.map(({ place, address, reference }) => (
              <li key={`${place}|${address ?? ''}|${reference ?? ''}`}>
                <span className="checkout-pickup-place">📍 {place}</span>
                {address && <span>{address}</span>}
                {reference && <small>Referencia: {reference}</small>}
                {!address && !reference && <small>El local no registró su dirección.</small>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
