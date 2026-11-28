import { describe, expect, it } from 'vitest'
import {
  normalizeOfertaFormValues,
  prepareOfertaSubmission,
} from '../../src/utils/ofertaFormSubmission'
import { calculateOfertaDiscount } from '../../src/utils/ofertaDiscount'
import type { OfertaFormValidationContext, OfertaFormValues } from '../../src/utils/ofertaFormTypes'

const values: OfertaFormValues = {
  nombre_producto: '  Pan del día  ',
  id_categoria: 'panaderia',
  descripcion: '  Pan recién horneado  ',
  precio_original: '12',
  precio_oferta: '8.5',
  cantidad_disponible: '4',
  horario_recojo: ' 17:00 - 19:00 hs ',
  fecha_limite: '2027-04-08T18:00',
  fecha_vencimiento: '2027-04-10',
  imagen_url: '',
}

const validationContext: OfertaFormValidationContext = {
  horarioInicio: '17:00',
  horarioFin: '19:00',
  fechaDia: '8',
  fechaMes: '4',
  fechaAnio: '2027',
  fechaHora: '18:00',
  imageMode: 'upload',
  ahoraLocal: '2027-04-08T10:00',
}

describe('oferta form submission', () => {
  it('normalizes text and decimal values before validation', () => {
    expect(normalizeOfertaFormValues(values)).toEqual({
      ...values,
      nombre_producto: 'Pan del día',
      descripcion: 'Pan recién horneado',
      precio_original: '12.00',
      precio_oferta: '8.50',
      horario_recojo: '17:00 - 19:00 hs',
    })
  })

  it('returns the validated application payload', () => {
    const result = prepareOfertaSubmission(values, validationContext)

    expect(result).toEqual({
      valid: true,
      expirationDate: '2027-04-10',
      payload: {
        nombre_producto: 'Pan del día',
        id_categoria: 'panaderia',
        descripcion: 'Pan recién horneado',
        precio_original: 12,
        precio_oferta: 8.5,
        cantidad_disponible: 4,
        horario_recojo: '17:00 - 19:00 hs',
        fecha_limite: '2027-04-08T18:00',
        imagen_url: '',
        estado: 'disponible',
      },
    })
    expect(result.valid && 'fecha_vencimiento' in result.payload).toBe(false)
  })

  it('returns validation errors without creating a payload', () => {
    const result = prepareOfertaSubmission(
      { ...values, precio_oferta: '13' },
      validationContext,
    )

    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('Se esperaba que el formulario fuera inválido.')
    expect(result.errors.precio_oferta).toBe('Debe ser menor al precio original.')
  })

  it('requires a valid date-only expiration date', () => {
    const missing = prepareOfertaSubmission(
      { ...values, fecha_vencimiento: '' },
      validationContext,
    )
    const invalid = prepareOfertaSubmission(
      { ...values, fecha_vencimiento: '2027-02-29' },
      validationContext,
    )

    expect(missing.valid).toBe(false)
    if (missing.valid) throw new Error('Se esperaba que faltara la fecha de vencimiento.')
    expect(missing.errors.fecha_vencimiento).toBe('Ingresa la fecha de vencimiento del producto.')
    expect(invalid.valid).toBe(false)
    if (invalid.valid) throw new Error('Se esperaba una fecha de vencimiento inválida.')
    expect(invalid.errors.fecha_vencimiento).toBe('Ingresa una fecha de vencimiento válida.')
  })
})

describe('calculateOfertaDiscount', () => {
  it('calculates a discount percentage only for valid reduced prices', () => {
    expect(calculateOfertaDiscount('100', '75')).toEqual({ valid: true, percentage: 25 })
    expect(calculateOfertaDiscount('100', '100')).toEqual({ valid: false, percentage: 0 })
    expect(calculateOfertaDiscount('invalid', '75')).toEqual({ valid: false, percentage: 0 })
  })
})
