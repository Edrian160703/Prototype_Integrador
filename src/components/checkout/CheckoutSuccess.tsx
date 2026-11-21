import type { CheckoutCompletion } from '../../hooks/useCheckoutForm'
import { maskDni } from '../../utils/dniMask'

interface CheckoutSuccessProps {
  completion: CheckoutCompletion
  onFinish: () => void
}

export default function CheckoutSuccess({ completion, onFinish }: CheckoutSuccessProps) {
  const paidOnline = completion.metodoPago === 'online'

  return (
    <div className="checkout-success" role="status">
      <span className="checkout-success-icon" aria-hidden="true">✓</span>
      <h2 id="checkout-title">{paidOnline ? 'Pago confirmado' : 'Reserva confirmada'}</h2>
      <p>
        {paidOnline
          ? `Recibimos tu pago de S/ ${completion.total.toFixed(2)}.`
          : `Pagarás S/ ${completion.total.toFixed(2)} en la tienda al recoger.`}
        {' '}Presenta tu DNI ({maskDni(completion.dni)}) para recoger tu pedido.
      </p>
      <button type="button" className="btn btn-primary btn-block" onClick={onFinish}>
        Listo
      </button>
    </div>
  )
}
