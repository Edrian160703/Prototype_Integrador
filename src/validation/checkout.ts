import type { CardDetails, CheckoutFormValues } from '../types/checkout'
import { isValidDni } from './dni'
import { isValidPhone } from './phone'

export const CARD_NUMBER_LENGTH = 16
export const CARD_EXPIRY_LENGTH = 5
export const CARD_CVV_MIN_LENGTH = 3
export const CARD_CVV_MAX_LENGTH = 4
const MIN_NAME_LENGTH = 3

export type CheckoutErrors = Partial<{
  nombre: string
  dni: string
  telefono: string
  cardNumber: string
  cardExpiry: string
  cardCvv: string
}>

const CARD_ERROR_KEYS: Record<keyof CardDetails, keyof CheckoutErrors> = {
  number: 'cardNumber',
  expiry: 'cardExpiry',
  cvv: 'cardCvv',
}

/** Clave de error que corresponde a cada campo de la tarjeta. */
export function cardErrorKey(field: keyof CardDetails): keyof CheckoutErrors {
  return CARD_ERROR_KEYS[field]
}

export function sanitizeCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, CARD_NUMBER_LENGTH)
}

/** "4111111111111111" -> "4111 1111 1111 1111" */
export function formatCardNumber(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** Acepta solo dígitos y agrega la barra: "1228" -> "12/28". */
export function sanitizeCardExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

export function sanitizeCardCvv(value: string): string {
  return value.replace(/\D/g, '').slice(0, CARD_CVV_MAX_LENGTH)
}

export function isValidCardNumber(value: string): boolean {
  return new RegExp(`^\\d{${CARD_NUMBER_LENGTH}}$`).test(value)
}

/** MM/AA con mes entre 01 y 12 y que no esté vencida (el mes actual todavía vale). */
export function isValidCardExpiry(value: string, now: Date = new Date()): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!match) return false

  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return false

  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

export function isValidCardCvv(value: string): boolean {
  return new RegExp(`^\\d{${CARD_CVV_MIN_LENGTH},${CARD_CVV_MAX_LENGTH}}$`).test(value)
}

export function validateCustomer(
  values: Pick<CheckoutFormValues, 'nombre' | 'dni' | 'telefono'>,
): CheckoutErrors {
  const errors: CheckoutErrors = {}

  if (values.nombre.trim().length < MIN_NAME_LENGTH) errors.nombre = 'Ingresa tu nombre completo.'
  if (!isValidDni(values.dni)) errors.dni = 'El DNI debe tener exactamente 8 dígitos.'
  if (!isValidPhone(values.telefono)) errors.telefono = 'Ingresa un teléfono de 9 dígitos.'

  return errors
}

export function validateCard(card: CardDetails, now: Date = new Date()): CheckoutErrors {
  const errors: CheckoutErrors = {}

  if (!isValidCardNumber(card.number)) errors.cardNumber = 'Ingresa los 16 dígitos de la tarjeta.'
  if (!isValidCardExpiry(card.expiry, now)) errors.cardExpiry = 'Usa el formato MM/AA y una fecha vigente.'
  if (!isValidCardCvv(card.cvv)) errors.cardCvv = 'El CVV tiene 3 o 4 dígitos.'

  return errors
}

/** Los datos de tarjeta solo se validan cuando el método elegido es pago online. */
export function validateCheckout(values: CheckoutFormValues, now: Date = new Date()): CheckoutErrors {
  return {
    ...validateCustomer(values),
    ...(values.metodoPago === 'online' ? validateCard(values.card, now) : {}),
  }
}
