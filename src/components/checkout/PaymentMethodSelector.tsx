import type { MetodoPago } from '../../types/checkout'

interface PaymentOption {
  value: MetodoPago
  title: string
  description: string
}

const PAYMENT_OPTIONS: readonly PaymentOption[] = [
  { value: 'tienda', title: 'Pagar en Tienda', description: 'Pagas al recoger tu pedido' },
  { value: 'online', title: 'Pagar Online', description: 'Tarjeta de crédito o débito' },
]

interface PaymentMethodSelectorProps {
  value: MetodoPago
  disabled?: boolean
  onChange: (value: MetodoPago) => void
}

export default function PaymentMethodSelector({ value, disabled = false, onChange }: PaymentMethodSelectorProps) {
  return (
    <fieldset className="checkout-fieldset" disabled={disabled}>
      <legend>Método de pago</legend>
      <div className="payment-options" role="radiogroup" aria-label="Método de pago">
        {PAYMENT_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`payment-option${value === option.value ? ' payment-option-selected' : ''}`}
          >
            <input
              type="radio"
              name="metodoPago"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="payment-option-text">
              <strong>{option.title}</strong>
              <small>{option.description}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
