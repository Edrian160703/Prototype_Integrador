import { describe, expect, it } from 'vitest'
import {
  preparePublicacionEdit,
  toPublicacionEditValues,
} from '../../src/utils/publicacionEditor'
import type { OwnedOferta } from '../../src/types/oferta'

const oferta: OwnedOferta = {
  id: 'offer-1',
  data: {
    id_producto: 'product-1',
    id_comercio: 'store-1',
    id_categoria: 'panaderia',
    nombre_producto: 'Pan del día',
    descripcion: 'Pan recién horneado',
    precio_original: 12,
    precio_oferta: 8,
    cantidad_disponible: 4,
    horario_recojo: '17:00 - 19:00 hs',
    estado: 'disponible',
    fecha_limite: new Date('2027-04-08T18:00:00'),
    imagen_url: null,
  },
}

describe('publicacionEditor', () => {
  it('prepara valores de formulario desde una publicación', () => {
    expect(toPublicacionEditValues(oferta)).toMatchObject({
      nombre_producto: 'Pan del día',
      precio_original: '12',
      precio_oferta: '8',
      imagen_url: '',
    })
  })

  it('rechaza precios de oferta iguales o mayores al precio original', () => {
    const values = toPublicacionEditValues(oferta)

    expect(preparePublicacionEdit({ ...values, precio_oferta: '12' })).toEqual({
      valid: false,
      message: 'El precio de oferta debe ser menor al precio original.',
    })
    expect(preparePublicacionEdit({ ...values, precio_oferta: '13' }).valid).toBe(false)
  })

  it('normaliza los campos y prepara un payload tipado al editar', () => {
    const result = preparePublicacionEdit({
      ...toPublicacionEditValues(oferta),
      nombre_producto: '  Pan campesino  ',
      descripcion: '  Recién horneado  ',
      horario_recojo: '  17:00 - 19:00  ',
      precio_original: '15.5',
      precio_oferta: '9.25',
      cantidad_disponible: '3',
    })

    expect(result).toEqual({
      valid: true,
      payload: {
        nombre_producto: 'Pan campesino',
        id_categoria: 'panaderia',
        descripcion: 'Recién horneado',
        precio_original: 15.5,
        precio_oferta: 9.25,
        cantidad_disponible: 3,
        horario_recojo: '17:00 - 19:00',
        fecha_limite: toPublicacionEditValues(oferta).fecha_limite,
        imagen_url: '',
      },
    })
  })
})
