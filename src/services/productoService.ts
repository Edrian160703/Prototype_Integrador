import type {
  ProductoAdminReader,
  ProductoByCommerceReader,
  ProductoByIdReader,
  ProductoCreator,
  ProductoDeleter,
  ProductoStateWriter,
} from '../ports/productoRepository'
import type {
  ProductoDocument,
  ProductoEstado,
  ProductoPayload,
} from '../types/producto'
import type { ProductoAdminRecord } from '../ports/productoRepository'

export interface CreateProductoParams {
  uid: string
  payload: ProductoPayload
}

/** Crea un producto en el catalogo del comercio (coleccion "productos"). */
export async function createProducto(
  repository: ProductoCreator,
  { uid, payload }: CreateProductoParams,
): Promise<string> {
  return await repository.create(payload, uid)
}

/** Devuelve los productos del catalogo de un comercio especifico. */
export async function getProductosByComercio(
  repository: ProductoByCommerceReader,
  idComercio: string,
): Promise<ProductoDocument[]> {
  return await repository.getByComercio(idComercio)
}

export async function getProductoById(
  repository: ProductoByIdReader,
  idProducto: string,
): Promise<ProductoDocument | null> {
  return await repository.getById(idProducto)
}

export async function updateProductoEstado(
  repository: ProductoStateWriter,
  idProducto: string,
  estado: ProductoEstado,
): Promise<void> {
  return await repository.updateEstado(idProducto, estado)
}

export async function deleteProducto(repository: ProductoDeleter, idProducto: string): Promise<void> {
  return await repository.delete(idProducto)
}

export async function getAllProductosForAdmin(repository: ProductoAdminReader): Promise<ProductoAdminRecord[]> {
  return repository.getAllForAdmin()
}
