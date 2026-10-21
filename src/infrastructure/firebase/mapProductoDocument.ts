import type { ProductoDocument, ProductoEstado } from '../../types/producto'
import { toDate } from './firestoreDates'

const PRODUCT_STATES: readonly ProductoEstado[] = ['activo', 'pausado', 'agotado']

function isProductoEstado(value: string): value is ProductoEstado {
  return PRODUCT_STATES.some((state) => state === value)
}

function requiredString(value: unknown, field: string, documentId: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`El campo "${field}" del producto ${documentId} debe ser un texto no vacío.`)
  }
  return value
}

function requiredFiniteNumber(value: unknown, field: string, documentId: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`El campo "${field}" del producto ${documentId} debe ser un número válido.`)
  }
  return value
}

export function mapProductoDocument(
  documentId: string,
  data: Record<string, unknown>,
): ProductoDocument {
  const state = data.estado
  if (typeof state !== 'string' || !isProductoEstado(state)) {
    throw new TypeError(`El estado del producto ${documentId} no es válido.`)
  }

  const price = requiredFiniteNumber(data.precio_original, 'precio_original', documentId)
  const stock = requiredFiniteNumber(data.stock, 'stock', documentId)
  if (price <= 0) throw new TypeError(`El precio del producto ${documentId} debe ser mayor que cero.`)
  if (!Number.isInteger(stock) || stock < 0) {
    throw new TypeError(`El stock del producto ${documentId} debe ser un entero no negativo.`)
  }

  if (data.imagen_url !== null && typeof data.imagen_url !== 'string') {
    throw new TypeError(`La imagen del producto ${documentId} debe ser texto o null.`)
  }

  return {
    id_producto: requiredString(data.id_producto, 'id_producto', documentId),
    id_comercio: requiredString(data.id_comercio, 'id_comercio', documentId),
    id_categoria: requiredString(data.id_categoria, 'id_categoria', documentId),
    nombre_producto: requiredString(data.nombre_producto, 'nombre_producto', documentId),
    descripcion: requiredString(data.descripcion, 'descripcion', documentId),
    precio_original: price,
    stock,
    estado: state,
    imagen_url: data.imagen_url,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}
