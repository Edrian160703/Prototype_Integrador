import type { ProductoEstado } from './producto'

export interface ProductoAdminItem {
  id: string
  name: string
  category: string
  storeName: string
  price: number
  stock: number
  status: ProductoEstado
  updatedAt: Date
}
