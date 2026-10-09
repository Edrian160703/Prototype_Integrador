import { CATEGORIAS_VISUALES } from '../config/ofertaCategories'
import type { ProductoAdminRecord } from '../ports/productoRepository'
import type { ProductoAdminItem } from '../types/productoAdmin'

export function toProductoAdminItems(records: ProductoAdminRecord[]): ProductoAdminItem[] {
  return records.map(({ product, storeName }) => ({
    id: product.id_producto,
    name: product.nombre_producto,
    category: CATEGORIAS_VISUALES.find((category) => category.id === product.id_categoria)?.label ?? 'Otros',
    storeName: storeName || 'Comercio FoodBack',
    price: product.precio_original,
    stock: product.stock,
    status: product.estado,
    updatedAt: product.updatedAt,
  }))
}
