import type { ComercioReader } from '../ports/comercioRepository'
import type {
  ProductoAdminReader,
  ProductoByCommerceReader,
  ProductoByIdReader,
  ProductoCreator,
  ProductoDeleter,
  ProductoStateWriter,
} from '../ports/productoRepository'
import type { ProductoDocument, ProductoEstado, ProductoPayload } from '../types/producto'
import type { ProductoAdminRecord } from '../types/productoAdmin'

export interface CreateProductoParams {
  uid: string
  payload: ProductoPayload
}

export async function createProducto(
  repository: ProductoCreator,
  { uid, payload }: CreateProductoParams,
): Promise<string> {
  return repository.create(payload, uid)
}

export function getProductosByComercio(
  repository: ProductoByCommerceReader,
  idComercio: string,
): Promise<ProductoDocument[]> {
  return repository.getByComercio(idComercio)
}

export function getProductoById(
  repository: ProductoByIdReader,
  idProducto: string,
): Promise<ProductoDocument | null> {
  return repository.getById(idProducto)
}

export function updateProductoEstado(
  repository: ProductoStateWriter,
  idProducto: string,
  estado: ProductoEstado,
): Promise<void> {
  return repository.updateEstado(idProducto, estado)
}

export function deleteProducto(repository: ProductoDeleter, idProducto: string): Promise<void> {
  return repository.delete(idProducto)
}

export async function getAllProductosForAdmin(
  repository: ProductoAdminReader,
  commerces: ComercioReader,
): Promise<ProductoAdminRecord[]> {
  const products = await repository.getAll()
  const commerceCache = new Map<string, Promise<Awaited<ReturnType<ComercioReader['getCommerceById']>>>>()

  return Promise.all(products.map(async (product) => {
    if (!commerceCache.has(product.id_comercio)) {
      commerceCache.set(product.id_comercio, commerces.getCommerceById(product.id_comercio))
    }
    const commerce = await commerceCache.get(product.id_comercio)!
    return { product, storeName: commerce?.businessName }
  }))
}
