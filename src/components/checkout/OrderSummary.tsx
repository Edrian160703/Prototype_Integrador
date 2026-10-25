import type { CartItem } from '../../types/cart'

interface OrderSummaryProps {
  items: CartItem[]
  total: number
}

export default function OrderSummary({ items, total }: OrderSummaryProps) {
  return (
    <section className="checkout-summary" aria-label="Resumen del pedido">
      <h3>Resumen del pedido</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <span className="checkout-summary-name">
              {item.title} <small>× {item.quantity}</small>
            </span>
            <span>S/ {(item.price * item.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="checkout-summary-total">
        <span>Total</span>
        <strong>S/ {total.toFixed(2)}</strong>
      </div>
    </section>
  )
}
