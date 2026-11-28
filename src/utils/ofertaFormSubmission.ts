import type { OfertaPayload } from '../types/oferta'
import { normalizeDecimalOnBlur } from './ofertaNumber'
import { validateOfertaForm } from './validateOfertaForm'
import type {
  FieldErrors,
  OfertaFormValidationContext,
  OfertaFormValues,
} from './ofertaFormTypes'

export type OfertaSubmissionResult =
  | { valid: true; payload: OfertaPayload }
  | { valid: false; errors: FieldErrors }

export function normalizeOfertaFormValues(values: OfertaFormValues): OfertaFormValues {
  return {
    ...values,
    nombre_producto: values.nombre_producto.trim(),
    descripcion: values.descripcion.trim(),
    horario_recojo: values.horario_recojo.trim(),
    precio_original: normalizeDecimalOnBlur(values.precio_original),
    precio_oferta: normalizeDecimalOnBlur(values.precio_oferta),
  }
}

export function prepareOfertaSubmission(
  rawValues: OfertaFormValues,
  context: OfertaFormValidationContext,
): OfertaSubmissionResult {
  const values = normalizeOfertaFormValues(rawValues)
  const errors = validateOfertaForm(values, context)

  if (Object.keys(errors).length > 0) return { valid: false, errors }

  return {
    valid: true,
    payload: {
      ...values,
      precio_original: Number(values.precio_original),
      precio_oferta: Number(values.precio_oferta),
      cantidad_disponible: Number(values.cantidad_disponible),
      estado: 'disponible',
    },
  }
}
