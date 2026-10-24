import { esFechaValida } from './ofertaDate'
import { isValidDecimal } from './ofertaNumber'
import type { FieldErrors, OfertaFormValidationContext, OfertaFormValues } from './ofertaFormTypes'

export const NOMBRE_MAX = 150
export const DESCRIPCION_MAX = 255
export const HORARIO_MAX = 100
export const IMAGEN_URL_MAX = 255

function isValidInteger(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

export function validateOfertaForm(
  values: OfertaFormValues,
  context: OfertaFormValidationContext,
): FieldErrors {
  const nextErrors: FieldErrors = {}

  if (!values.nombre_producto.trim()) {
    nextErrors.nombre_producto = 'Ingresa el nombre del producto.'
  } else if (values.nombre_producto.length > NOMBRE_MAX) {
    nextErrors.nombre_producto = `Máximo ${NOMBRE_MAX} caracteres.`
  }

  if (!values.id_categoria) {
    nextErrors.id_categoria = 'Selecciona una categoría.'
  }

  if (!values.descripcion.trim()) {
    nextErrors.descripcion = 'Agrega una breve descripción del producto.'
  } else if (values.descripcion.length > DESCRIPCION_MAX) {
    nextErrors.descripcion = `Máximo ${DESCRIPCION_MAX} caracteres.`
  }

  if (!values.precio_original.trim()) {
    nextErrors.precio_original = 'Ingresa el precio original.'
  } else if (!isValidDecimal(values.precio_original) || Number(values.precio_original) <= 0) {
    nextErrors.precio_original = 'Ingresa un precio válido (ej. 25.90).'
  }

  if (!values.precio_oferta.trim()) {
    nextErrors.precio_oferta = 'Ingresa el precio de oferta.'
  } else if (!isValidDecimal(values.precio_oferta) || Number(values.precio_oferta) <= 0) {
    nextErrors.precio_oferta = 'Ingresa un precio válido (ej. 12.90).'
  } else if (
    isValidDecimal(values.precio_original) &&
    Number(values.precio_oferta) >= Number(values.precio_original)
  ) {
    nextErrors.precio_oferta = 'Debe ser menor al precio original.'
  }

  if (!values.cantidad_disponible.trim()) {
    nextErrors.cantidad_disponible = 'Ingresa la cantidad disponible.'
  } else if (!isValidInteger(values.cantidad_disponible) || Number(values.cantidad_disponible) < 1) {
    nextErrors.cantidad_disponible = 'Ingresa un número entero mayor a 0.'
  }

  if (!context.horarioInicio || !context.horarioFin) {
    nextErrors.horario_recojo = 'Selecciona la hora de inicio y fin del recojo.'
  } else if (context.horarioInicio >= context.horarioFin) {
    nextErrors.horario_recojo = 'La hora de fin debe ser posterior a la de inicio.'
  } else if (values.horario_recojo.length > HORARIO_MAX) {
    nextErrors.horario_recojo = `Máximo ${HORARIO_MAX} caracteres.`
  }

  if (context.imageMode === 'url' && values.imagen_url.length > IMAGEN_URL_MAX) {
    nextErrors.imagen_url = `La URL no debe superar los ${IMAGEN_URL_MAX} caracteres.`
  }

  if (!context.fechaDia || !context.fechaMes || !context.fechaAnio || !context.fechaHora) {
    nextErrors.fecha_limite = 'Completa la fecha y hora límite.'
  } else if (!esFechaValida(context.fechaDia, context.fechaMes, context.fechaAnio)) {
    nextErrors.fecha_limite = 'Ingresa una fecha válida.'
  } else if (values.fecha_limite < context.ahoraLocal) {
    nextErrors.fecha_limite = 'La fecha límite debe ser posterior al momento actual.'
  }

  return nextErrors
}
