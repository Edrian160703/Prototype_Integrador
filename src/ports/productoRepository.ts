import type { ProductoDocument, ProductoEstado, ProductoPayload } from '../types/producto'

export interface ProductoAdminRecord {
  product: ProductoDocument
  storeName?: string
}

export interface ProductoCreator {
  create(payload: ProductoPayload, uid: string): Promise<string>
}

export interface ProductoByCommerceReader {
  getByComercio(idComercio: string): Promise<ProductoDocument[]>
}

export interface ProductoByIdReader {
  getById(idProducto: string): Promise<ProductoDocument | null>
}

export interface ProductoStateWriter {
  updateEstado(idProducto: string, estado: ProductoEstado): Promise<void>
}

export interface ProductoDeleter {
  delete(idProducto: string): Promise<void>
}

export interface ProductoAdminReader {
  getAllForAdmin(): Promise<ProductoAdminRecord[]>
}
