import type { OfertaCreator, OfertaReader, OfertaWriter } from '../ports/ofertaRepository'
import type { ComercioReader, ComercioSummary } from '../ports/comercioRepository'
import type { ProductoCreator } from '../ports/productoRepository'
import type { OfertaDocument, OfertaPayload } from '../types/oferta'

export interface CreateOfertaParams {
  uid: string
  payload: OfertaPayload
}

export interface OwnedOferta {
  id: string
  data: OfertaDocument
}

export interface OfertaConComercio {
  id: string
  data: OfertaDocument
  comercio: ComercioSummary | null
}

function generateOfferId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `off_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

export function createOferta(repository: OfertaCreator, { uid, payload }: CreateOfertaParams): Promise<string> {
  const idProducto = generateOfferId()
  return repository.create(uid, payload, idProducto)
}

export async function createOfertaConProducto(
  { uid, payload }: CreateOfertaParams,
  productoCreator: ProductoCreator,
  ofertaCreator: OfertaCreator,
): Promise<string> {
  const idProducto = await productoCreator.create(
    {
      nombre_producto: payload.nombre_producto,
      id_categoria: payload.id_categoria,
      descripcion: payload.descripcion,
      precio_original: payload.precio_original,
      stock: payload.cantidad_disponible,
      imagen_url: payload.imagen_url,
      estado: 'activo',
    },
    uid,
  )
  return ofertaCreator.create(uid, payload, idProducto, generateOfferId())
}

export async function getOfertas(
  repository: OfertaReader,
  comercios: ComercioReader,
): Promise<OfertaConComercio[]> {
  const ofertas = await repository.listAll()
  const cache = new Map<string, Promise<Awaited<ReturnType<ComercioReader['getCommerceById']>>>>()

  return Promise.all(ofertas.map(async ({ id, data }) => {
    if (!cache.has(data.id_comercio)) cache.set(data.id_comercio, comercios.getCommerceById(data.id_comercio))
    return { id, data, comercio: await cache.get(data.id_comercio)! }
  }))
}

export async function getOfertaById(
  idOferta: string,
  repository: OfertaReader,
  comercios: ComercioReader,
): Promise<OfertaConComercio | null> {
  const oferta = await repository.getById(idOferta)
  if (!oferta) return null
  const comercio = await comercios.getCommerceById(oferta.data.id_comercio)
  return { ...oferta, comercio }
}

export async function getOfertasByOwner(repository: OfertaReader, uid: string): Promise<OwnedOferta[]> {
  return repository.listByOwner(uid)
}

export function updateOferta(
  repository: OfertaWriter,
  id: string,
  uid: string,
  payload: Omit<OfertaPayload, 'estado'>,
): Promise<void> {
  return repository.updateOwned(id, uid, payload)
}

export function deleteOferta(repository: OfertaWriter, id: string, uid: string): Promise<void> {
  return repository.deleteOwned(id, uid)
}
