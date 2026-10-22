import {
  createProducto,
  deleteProducto,
  getAllProductosForAdmin,
  getProductoById,
  getProductosByComercio,
  updateProductoEstado,
} from '../application/productos'
import type { ProductApplication } from '../application/contracts'
import type {
  ComercioReader,
} from '../ports/comercioRepository'
import type {
  ProductoAdminReader,
  ProductoByCommerceReader,
  ProductoByIdReader,
  ProductoCreator,
  ProductoDeleter,
  ProductoStateWriter,
} from '../ports/productoRepository'
import type { ProductoEstado, ProductoPayload } from '../types/producto'

type ProductRepository =
  & ProductoCreator
  & ProductoByCommerceReader
  & ProductoByIdReader
  & ProductoStateWriter
  & ProductoDeleter
  & ProductoAdminReader

interface ProductServiceDependencies {
  products: () => Promise<ProductRepository>
  commerces: () => Promise<ComercioReader>
}

export function createProductServices({
  products,
  commerces,
}: ProductServiceDependencies): ProductApplication {
  return {
    createProducto: async (uid: string, payload: ProductoPayload) =>
      createProducto(await products(), { uid, payload }),
    getProductosByComercio: async (idComercio: string) =>
      getProductosByComercio(await products(), idComercio),
    getProductoById: async (idProducto: string) =>
      getProductoById(await products(), idProducto),
    updateProductoEstado: async (idProducto: string, estado: ProductoEstado) =>
      updateProductoEstado(await products(), idProducto, estado),
    deleteProducto: async (idProducto: string) =>
      deleteProducto(await products(), idProducto),
    getAllProductosForAdmin: async () => {
      const [productRepository, commerceRepository] = await Promise.all([products(), commerces()])
      return getAllProductosForAdmin(productRepository, commerceRepository)
    },
  }
}
