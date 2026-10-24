import type { ProductoDocument, ProductoEstado } from './producto'

export interface ProductoAdminRecord {
  product: ProductoDocument
  storeName?: string
}

export interface ProductoAdminItem {
  id: string
  name: string
  category: string
  storeName: string
  price: number
  stock: number
  status: ProductoEstado
  createdAt: Date
  updatedAt: Date
}
