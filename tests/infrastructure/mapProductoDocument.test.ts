import { describe, expect, it } from 'vitest'
import { mapProductoDocument } from '../../src/infrastructure/firebase/mapProductoDocument'

const validDocument: Record<string, unknown> = {
  id_producto: 'product-1',
  id_comercio: 'store-1',
  id_categoria: 'panaderia',
  nombre_producto: 'Pan del día',
  descripcion: 'Pan recién horneado',
  precio_original: 12,
  stock: 4,
  estado: 'activo',
  imagen_url: null,
  createdAt: new Date('2026-10-01T12:00:00'),
  updatedAt: new Date('2026-10-02T12:00:00'),
}

describe('mapProductoDocument', () => {
  it('convierte un documento válido en un producto de dominio', () => {
    expect(mapProductoDocument('product-1', validDocument)).toEqual({
      ...validDocument,
    })
  })

  it.each([
    ['id_producto', undefined],
    ['precio_original', '12'],
    ['stock', 2.5],
    ['estado', 'desconocido'],
    ['imagen_url', 12],
    ['createdAt', undefined],
  ])('rechaza el campo inválido %s', (field, value) => {
    expect(() => mapProductoDocument('product-1', {
      ...validDocument,
      [field]: value,
    })).toThrow()
  })
})
