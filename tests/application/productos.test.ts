import { describe, expect, it, vi } from 'vitest'
import {
  createProducto,
  deleteProducto,
  getAllProductosForAdmin,
  getProductoById,
  getProductosByComercio,
  updateProductoEstado,
} from '../../src/application/productos'
import type { ComercioReader } from '../../src/ports/comercioRepository'
import type {
  ProductoAdminReader,
  ProductoByCommerceReader,
  ProductoByIdReader,
  ProductoCreator,
  ProductoDeleter,
  ProductoStateWriter,
} from '../../src/ports/productoRepository'
import type { ProductoDocument, ProductoPayload } from '../../src/types/producto'

const payload: ProductoPayload = {
  nombre_producto: 'Pan del día',
  id_categoria: 'panaderia',
  descripcion: 'Pan recién horneado',
  precio_original: 12,
  stock: 4,
  imagen_url: '',
  estado: 'activo',
}

function producto(overrides: Partial<ProductoDocument> = {}): ProductoDocument {
  return {
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
    updatedAt: new Date('2026-10-01T12:00:00'),
    ...overrides,
  }
}

describe('casos de uso de productos', () => {
  it('crea el producto a través del puerto de escritura', async () => {
    const repository: ProductoCreator = {
      create: vi.fn().mockResolvedValue('product-1'),
    }

    await expect(createProducto(repository, { uid: 'user-1', payload })).resolves.toBe('product-1')
    expect(repository.create).toHaveBeenCalledWith(payload, 'user-1')
  })

  it('delega las consultas por comercio e identificador', async () => {
    const data = producto()
    const byCommerce: ProductoByCommerceReader = {
      getByComercio: vi.fn().mockResolvedValue([data]),
    }
    const byId: ProductoByIdReader = {
      getById: vi.fn().mockResolvedValue(data),
    }
    const missingById: ProductoByIdReader = {
      getById: vi.fn().mockResolvedValue(null),
    }

    await expect(getProductosByComercio(byCommerce, 'store-1')).resolves.toEqual([data])
    await expect(getProductoById(byId, 'product-1')).resolves.toEqual(data)
    await expect(getProductoById(missingById, 'missing')).resolves.toBeNull()
    expect(byCommerce.getByComercio).toHaveBeenCalledWith('store-1')
    expect(byId.getById).toHaveBeenCalledWith('product-1')
  })

  it('delega las actualizaciones de estado y la eliminación', async () => {
    const stateWriter: ProductoStateWriter = {
      updateEstado: vi.fn().mockResolvedValue(undefined),
    }
    const deleter: ProductoDeleter = {
      delete: vi.fn().mockResolvedValue(undefined),
    }

    await expect(updateProductoEstado(stateWriter, 'product-1', 'pausado')).resolves.toBeUndefined()
    await expect(deleteProducto(deleter, 'product-1')).resolves.toBeUndefined()
    expect(stateWriter.updateEstado).toHaveBeenCalledWith('product-1', 'pausado')
    expect(deleter.delete).toHaveBeenCalledWith('product-1')
  })

  it('enriquece los productos del panel y consulta una sola vez cada comercio', async () => {
    const records = [
      producto(),
      producto({ id_producto: 'product-2', nombre_producto: 'Galletas' }),
      producto({ id_producto: 'product-3', id_comercio: 'store-2' }),
    ]
    const repository: ProductoAdminReader = {
      getAll: vi.fn().mockResolvedValue(records),
    }
    const comercios: ComercioReader = {
      getCommerceById: vi.fn()
        .mockResolvedValueOnce({ businessName: 'Panadería Central' })
        .mockResolvedValueOnce(null),
    }

    await expect(getAllProductosForAdmin(repository, comercios)).resolves.toEqual([
      { product: records[0], storeName: 'Panadería Central' },
      { product: records[1], storeName: 'Panadería Central' },
      { product: records[2], storeName: undefined },
    ])
    expect(comercios.getCommerceById).toHaveBeenCalledTimes(2)
    expect(comercios.getCommerceById).toHaveBeenNthCalledWith(1, 'store-1')
    expect(comercios.getCommerceById).toHaveBeenNthCalledWith(2, 'store-2')
  })

  it('propaga los errores de persistencia', async () => {
    const repository: ProductoCreator = {
      create: vi.fn().mockRejectedValue(new Error('Firestore no disponible')),
    }

    await expect(createProducto(repository, { uid: 'user-1', payload }))
      .rejects.toThrow('Firestore no disponible')
  })
})
