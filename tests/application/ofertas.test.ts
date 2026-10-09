import { describe, expect, it, vi } from 'vitest'
import {
  createOferta,
  createOfertaConProducto,
  deleteOferta,
  getOfertaById,
  getOfertas,
  getOfertasByOwner,
  updateOferta,
} from '../../src/application/ofertas'
import type { ComercioReader } from '../../src/ports/comercioRepository'
import type {
  OfertaByIdReader,
  OfertaCreator,
  OfertaListReader,
  OfertaOwnerReader,
  OfertaWriter,
} from '../../src/ports/ofertaRepository'
import type { ProductoCreator } from '../../src/ports/productoRepository'
import type { OfertaDocument, OfertaPayload } from '../../src/types/oferta'

const payload: OfertaPayload = {
  nombre_producto: 'Pan del día',
  id_categoria: 'panaderia',
  descripcion: 'Pan recién horneado',
  precio_original: 12,
  precio_oferta: 8,
  cantidad_disponible: 4,
  horario_recojo: '17:00-19:00',
  estado: 'disponible',
  fecha_limite: '2026-10-10T19:00',
  imagen_url: '',
}

function oferta(overrides: Partial<OfertaDocument> = {}): OfertaDocument {
  return {
    id_producto: 'product-1',
    id_comercio: 'store-1',
    id_categoria: 'panaderia',
    nombre_producto: 'Pan del día',
    descripcion: 'Pan recién horneado',
    precio_original: 12,
    precio_oferta: 8,
    cantidad_disponible: 4,
    horario_recojo: '17:00-19:00',
    estado: 'disponible',
    fecha_limite: new Date('2026-10-10T19:00:00'),
    imagen_url: null,
    ...overrides,
  }
}

describe('casos de uso de ofertas', () => {
  it('crea una oferta delegando la persistencia al repositorio', async () => {
    const repository: OfertaCreator = {
      create: vi.fn().mockResolvedValue('offer-1'),
    }

    await expect(createOferta(repository, { uid: 'user-1', payload })).resolves.toBe('offer-1')
    expect(repository.create).toHaveBeenCalledWith('user-1', payload, expect.any(String))
  })

  it('crea el producto antes de crear la oferta asociada', async () => {
    const productoCreator: ProductoCreator = {
      create: vi.fn().mockResolvedValue('product-1'),
    }
    const ofertaCreator: OfertaCreator = {
      create: vi.fn().mockResolvedValue('offer-1'),
    }

    await expect(
      createOfertaConProducto({ uid: 'user-1', payload }, productoCreator, ofertaCreator),
    ).resolves.toBe('offer-1')

    expect(productoCreator.create).toHaveBeenCalledWith({
      nombre_producto: payload.nombre_producto,
      id_categoria: payload.id_categoria,
      descripcion: payload.descripcion,
      precio_original: payload.precio_original,
      stock: payload.cantidad_disponible,
      imagen_url: payload.imagen_url,
      estado: 'activo',
    }, 'user-1')
    expect(ofertaCreator.create).toHaveBeenCalledWith(
      'user-1',
      payload,
      'product-1',
      expect.any(String),
    )
  })

  it('no intenta guardar la oferta si falla la creación del producto', async () => {
    const productoCreator: ProductoCreator = {
      create: vi.fn().mockRejectedValue(new Error('falló el producto')),
    }
    const ofertaCreator: OfertaCreator = {
      create: vi.fn(),
    }

    await expect(
      createOfertaConProducto({ uid: 'user-1', payload }, productoCreator, ofertaCreator),
    ).rejects.toThrow('falló el producto')
    expect(ofertaCreator.create).not.toHaveBeenCalled()
  })

  it('enriquece las ofertas y reutiliza la lectura de un comercio repetido', async () => {
    const first = oferta()
    const second = oferta({ nombre_producto: 'Galletas' })
    const repository: OfertaListReader = {
      listAll: vi.fn().mockResolvedValue([
        { id: 'offer-1', data: first },
        { id: 'offer-2', data: second },
      ]),
    }
    const comercios: ComercioReader = {
      getCommerceById: vi.fn().mockResolvedValue({ businessName: 'Panadería Central' }),
    }

    await expect(getOfertas(repository, comercios)).resolves.toEqual([
      { id: 'offer-1', data: first, comercio: { businessName: 'Panadería Central' } },
      { id: 'offer-2', data: second, comercio: { businessName: 'Panadería Central' } },
    ])
    expect(comercios.getCommerceById).toHaveBeenCalledTimes(1)
    expect(comercios.getCommerceById).toHaveBeenCalledWith('store-1')
  })

  it('devuelve null si no existe la oferta y no consulta el comercio', async () => {
    const repository: OfertaByIdReader = {
      getById: vi.fn().mockResolvedValue(null),
    }
    const comercios: ComercioReader = {
      getCommerceById: vi.fn(),
    }

    await expect(getOfertaById('missing', repository, comercios)).resolves.toBeNull()
    expect(comercios.getCommerceById).not.toHaveBeenCalled()
  })

  it('devuelve el detalle de la oferta con su comercio', async () => {
    const data = oferta()
    const repository: OfertaByIdReader = {
      getById: vi.fn().mockResolvedValue({ id: 'offer-1', data }),
    }
    const comercios: ComercioReader = {
      getCommerceById: vi.fn().mockResolvedValue({ businessName: 'Panadería Central' }),
    }

    await expect(getOfertaById('offer-1', repository, comercios)).resolves.toEqual({
      id: 'offer-1',
      data,
      comercio: { businessName: 'Panadería Central' },
    })
  })

  it('delega consultas del propietario y cambios de la oferta', async () => {
    const owned: OfertaOwnerReader = {
      listByOwner: vi.fn().mockResolvedValue([{ id: 'offer-1', data: oferta() }]),
    }
    const writer: OfertaWriter = {
      updateOwned: vi.fn().mockResolvedValue(undefined),
      deleteOwned: vi.fn().mockResolvedValue(undefined),
    }
    const editablePayload = { ...payload }
    delete (editablePayload as Partial<OfertaPayload>).estado

    await expect(getOfertasByOwner(owned, 'user-1')).resolves.toHaveLength(1)
    await expect(updateOferta(writer, 'offer-1', 'user-1', editablePayload)).resolves.toBeUndefined()
    await expect(deleteOferta(writer, 'offer-1', 'user-1')).resolves.toBeUndefined()
    expect(owned.listByOwner).toHaveBeenCalledWith('user-1')
    expect(writer.updateOwned).toHaveBeenCalledWith('offer-1', 'user-1', editablePayload)
    expect(writer.deleteOwned).toHaveBeenCalledWith('offer-1', 'user-1')
  })
})
