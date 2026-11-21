import { useEffect, type MouseEvent } from 'react'
import { useCheckoutForm } from '../../hooks/useCheckoutForm'
import CardFields from './CardFields'
import CheckoutSuccess from './CheckoutSuccess'
import CustomerFields from './CustomerFields'
import OrderSummary from './OrderSummary'
import PaymentMethodSelector from './PaymentMethodSelector'
import StorePaymentNotice from './StorePaymentNotice'
import type { CheckoutCustomer } from '../../types/checkout'
import { cardErrorKey } from '../../validation/checkout'
import '../../styles/checkout.css'

interface CheckoutModalProps {
  /** El usuario vuelve al carrito sin completar la compra. */
  onClose: () => void
  /** La compra terminó y el usuario cerró la confirmación. */
  onFinished: () => void
}

export default function CheckoutModal({ onClose, onFinished }: CheckoutModalProps) {
  const {
    values,
    errors,
    items,
    totalPrice,
    submitting,
    submitError,
    completion,
    updateCustomer,
    updateCard,
    selectMetodoPago,
    validateField,
    handleSubmit,
  } = useCheckoutForm()

  const leave = completion ? onFinished : onClose

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) leave()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [leave, submitting])

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !submitting) leave()
  }

  const payOnline = values.metodoPago === 'online'

  return (
    <div className="modal-overlay checkout-overlay" onClick={handleOverlayClick}>
      <div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        {completion ? (
          <CheckoutSuccess completion={completion} onFinish={onFinished} />
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="checkout-head">
              <h2 id="checkout-title">Finalizar compra</h2>
              <button
                type="button"
                className="modal-close"
                aria-label="Cerrar"
                onClick={onClose}
                disabled={submitting}
              >
                ×
              </button>
            </div>

            <CustomerFields
              values={values}
              errors={errors}
              disabled={submitting}
              onChange={updateCustomer}
              onBlur={(field: keyof CheckoutCustomer) => validateField(field)}
            />

            <PaymentMethodSelector value={values.metodoPago} disabled={submitting} onChange={selectMetodoPago} />

            {payOnline ? (
              <CardFields
                card={values.card}
                errors={errors}
                disabled={submitting}
                onChange={updateCard}
                onBlur={(field) => validateField(cardErrorKey(field))}
              />
            ) : (
              <StorePaymentNotice dni={values.dni} total={totalPrice} items={items} />
            )}

            <OrderSummary items={items} total={totalPrice} />

            {submitError && <p className="cart-error" role="alert">{submitError}</p>}

            <button type="submit" className="btn btn-primary btn-block checkout-submit" disabled={submitting}>
              {submitting
                ? (payOnline ? 'Procesando pago…' : 'Reservando…')
                : (payOnline ? 'Pagar y Confirmar' : 'Confirmar Reserva')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
