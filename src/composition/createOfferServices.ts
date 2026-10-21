import {
  createOferta,
  createOfertaConProducto,
  deleteOferta,
  getOfertaById,
  getOfertas,
  getOfertasByOwner,
  updateOferta,
} from '../application/ofertas'
import type { OfferApplication } from '../application/contracts'
import type { ComercioReader } from '../ports/comercioRepository'
import type {
  OfertaByIdReader,
  OfertaCreator,
  OfertaListReader,
  OfertaOwnerReader,
  OfertaWriter,
} from '../ports/ofertaRepository'
import type { ProductoCreator } from '../ports/productoRepository'
import type { CreateOfertaParams, OfertaPayload } from '../types/oferta'

type OfferRepository =
  & OfertaCreator
  & OfertaByIdReader
  & OfertaListReader
  & OfertaOwnerReader
  & OfertaWriter

interface OfferServiceDependencies {
  offers: () => Promise<OfferRepository>
  products: () => Promise<ProductoCreator>
  commerces: () => Promise<ComercioReader>
}

export function createOfferServices({
  offers,
  products,
  commerces,
}: OfferServiceDependencies): OfferApplication {
  return {
    createOferta: async (params: CreateOfertaParams) =>
      createOferta(await offers(), params),
    createOfertaConProducto: async (params: CreateOfertaParams) => {
      const [productRepository, offerRepository] = await Promise.all([products(), offers()])
      return createOfertaConProducto(params, productRepository, offerRepository)
    },
    getOfertas: async () => {
      const [offerRepository, commerceRepository] = await Promise.all([offers(), commerces()])
      return getOfertas(offerRepository, commerceRepository)
    },
    getOfertaById: async (idOferta: string) => {
      const [offerRepository, commerceRepository] = await Promise.all([offers(), commerces()])
      return getOfertaById(idOferta, offerRepository, commerceRepository)
    },
    getOfertasByOwner: async (uid: string) =>
      getOfertasByOwner(await offers(), uid),
    updateOferta: async (id: string, uid: string, payload: Omit<OfertaPayload, 'estado'>) =>
      updateOferta(await offers(), id, uid, payload),
    deleteOferta: async (id: string, uid: string) =>
      deleteOferta(await offers(), id, uid),
  }
}
