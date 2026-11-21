import { useCallback, useState, type FormEvent } from 'react'
import { useReservationCheckout } from '../context/ApplicationContext'
import { useAuthSession, useUserProfile } from '../context/AuthContext'
import { useCartManagement, useCartSummary } from '../context/CartContext'
import type { AuthIdentity } from '../ports/authGateway'
import type {
  CardDetails,
  CheckoutCustomer,
  CheckoutFormValues,
  MetodoPago,
} from '../types/checkout'
import type { UserDocument } from '../types/user'
import { sanitizeDni } from '../validation/dni'
import { normalizePhone } from '../validation/phone'
import {
  cardErrorKey,
  sanitizeCardCvv,
  sanitizeCardExpiry,
  sanitizeCardNumber,
  validateCheckout,
  type CheckoutErrors,
} from '../validation/checkout'

export interface CheckoutCompletion {
  metodoPago: MetodoPago
  dni: string
  total: number
  reservations: number
}

const EMPTY_CARD: CardDetails = { number: '', expiry: '', cvv: '' }

const CARD_SANITIZERS: Record<keyof CardDetails, (value: string) => string> = {
  number: sanitizeCardNumber,
  expiry: sanitizeCardExpiry,
  cvv: sanitizeCardCvv,
}

/** Precarga lo que ya sabemos del consumidor; todo sigue siendo editable. */
function initialValues(user: AuthIdentity | null, profile: UserDocument | null): CheckoutFormValues {
  const consumer = profile?.role === 'consumer' ? profile : null
  const fullName = [consumer?.firstName, consumer?.lastName].filter(Boolean).join(' ')

  return {
    nombre: fullName || user?.displayName || '',
    dni: sanitizeDni(consumer?.dni ?? ''),
    telefono: normalizePhone(consumer?.phone ?? ''),
    metodoPago: 'tienda',
    card: EMPTY_CARD,
  }
}

export function useCheckoutForm() {
  const { user } = useAuthSession()
  const { profile } = useUserProfile()
  const { items, totalPrice } = useCartSummary()
  const { clearCart } = useCartManagement()
  const { confirmarCheckout } = useReservationCheckout()

  const [values, setValues] = useState<CheckoutFormValues>(() => initialValues(user, profile))
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [completion, setCompletion] = useState<CheckoutCompletion | null>(null)

  const updateCustomer = useCallback((field: keyof CheckoutCustomer, value: string) => {
    const next = field === 'dni' ? sanitizeDni(value) : value
    setValues((current) => ({ ...current, [field]: next }))
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }, [])

  const updateCard = useCallback((field: keyof CardDetails, value: string) => {
    setValues((current) => ({
      ...current,
      card: { ...current.card, [field]: CARD_SANITIZERS[field](value) },
    }))
    const errorKey = cardErrorKey(field)
    setErrors((current) => (current[errorKey] ? { ...current, [errorKey]: undefined } : current))
  }, [])

  const selectMetodoPago = useCallback((metodoPago: MetodoPago) => {
    setValues((current) => ({ ...current, metodoPago }))
    setSubmitError(null)
  }, [])

  /** Valida un solo campo al salir de él, sin llenar de errores al resto del formulario. */
  const validateField = (key: keyof CheckoutErrors) => {
    const found = validateCheckout(values)[key]
    setErrors((current) => ({ ...current, [key]: found }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    if (!user) {
      setSubmitError('Debes iniciar sesión para reservar.')
      return
    }

    const form = event.currentTarget
    const found = validateCheckout(values)
    setErrors(found)
    setSubmitError(null)
    if (Object.keys(found).length > 0) {
      setTimeout(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
      return
    }

    setSubmitting(true)
    try {
      const reservationIds = await confirmarCheckout(
        user.uid,
        user.email ?? '',
        items,
        {
          customer: { nombre: values.nombre, dni: values.dni, telefono: values.telefono },
          metodoPago: values.metodoPago,
          card: values.metodoPago === 'online' ? values.card : undefined,
        },
        user.displayName,
      )
      setCompletion({
        metodoPago: values.metodoPago,
        dni: values.dni,
        total: totalPrice,
        reservations: reservationIds.length,
      })
      clearCart()
    } catch (error) {
      console.error('Error al confirmar el checkout', error)
      setSubmitError(
        error instanceof Error ? error.message : 'No se pudo completar la compra. Inténtalo de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return {
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
  }
}
