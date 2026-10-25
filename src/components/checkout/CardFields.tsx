import type { CardDetails } from '../../types/checkout'
import {
  CARD_CVV_MAX_LENGTH,
  CARD_EXPIRY_LENGTH,
  formatCardNumber,
  type CheckoutErrors,
} from '../../validation/checkout'

interface CardFieldsProps {
  card: CardDetails
  errors: CheckoutErrors
  disabled?: boolean
  onChange: (field: keyof CardDetails, value: string) => void
  onBlur: (field: keyof CardDetails) => void
}

export default function CardFields({ card, errors, disabled = false, onChange, onBlur }: CardFieldsProps) {
  return (
    <fieldset className="checkout-card" disabled={disabled}>
      <legend className="visually-hidden-legend">Datos de la tarjeta</legend>

      <div className="field">
        <label htmlFor="checkout-card-number">Número de tarjeta</label>
        <input
          id="checkout-card-number"
          inputMode="numeric"
          autoComplete="cc-number"
          value={formatCardNumber(card.number)}
          onChange={(event) => onChange('number', event.target.value)}
          onBlur={() => onBlur('number')}
          placeholder="0000 0000 0000 0000"
          aria-invalid={Boolean(errors.cardNumber)}
        />
        {errors.cardNumber && <span className="field-error">{errors.cardNumber}</span>}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="checkout-card-expiry">Vencimiento</label>
          <input
            id="checkout-card-expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            maxLength={CARD_EXPIRY_LENGTH}
            value={card.expiry}
            onChange={(event) => onChange('expiry', event.target.value)}
            onBlur={() => onBlur('expiry')}
            placeholder="MM/AA"
            aria-invalid={Boolean(errors.cardExpiry)}
          />
          {errors.cardExpiry && <span className="field-error">{errors.cardExpiry}</span>}
        </div>

        <div className="field">
          <label htmlFor="checkout-card-cvv">CVV</label>
          <input
            id="checkout-card-cvv"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={CARD_CVV_MAX_LENGTH}
            value={card.cvv}
            onChange={(event) => onChange('cvv', event.target.value)}
            onBlur={() => onBlur('cvv')}
            placeholder="123"
            aria-invalid={Boolean(errors.cardCvv)}
          />
          {errors.cardCvv && <span className="field-error">{errors.cardCvv}</span>}
        </div>
      </div>

      <p className="checkout-hint">Pago simulado: no se realiza ningún cobro real ni se guarda tu tarjeta.</p>
    </fieldset>
  )
}
