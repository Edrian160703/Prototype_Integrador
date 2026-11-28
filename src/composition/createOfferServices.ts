import {
  createOferta,
  createOfertaConProducto,
  deleteOferta,
  getOfertaById,
  getOfertas,
  getOfertasVigentes,
  getOfertasByOwner,
  updateOferta,
} from '../application/ofertas'
import { PublicationCommitUnknownError } from '../application/ofertas'
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
import type { IdGenerator, NamedIdGenerator } from '../ports/idGenerator'
import type {
  CreateOfertaParams,
  CreateOfertaPublicationParams,
  OfertaPayload,
} from '../types/oferta'
import type { ProductPublicationStorage } from '../ports/productPublicationStorage'

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
  idGenerator: IdGenerator
  offerIds: NamedIdGenerator
  publicationStorage: () => Promise<ProductPublicationStorage>
}

export function createOfferServices({
  offers,
  products,
  commerces,
  idGenerator,
  offerIds,
  publicationStorage,
}: OfferServiceDependencies): OfferApplication {
  return {
    createOferta: async (params: CreateOfertaParams) =>
      createOferta(await offers(), params, idGenerator, offerIds),
    createOfertaConProducto: async (params: CreateOfertaPublicationParams) => {
      const storage = await publicationStorage()
      const uploaded = await storage.upload(params.uid, {
        food: params.images.food,
        expirationEvidence: params.images.expirationEvidence,
      })

      try {
        const [productRepository, offerRepository] = await Promise.all([products(), offers()])
        return await createOfertaConProducto(
          {
            uid: params.uid,
            payload: { ...params.payload, imagen_url: uploaded.foodImageUrl },
          },
          productRepository,
          offerRepository,
          offerIds,
          {
            imagePath: uploaded.expirationImagePath,
            imageId: uploaded.expirationImageId,
            expirationDate: params.images.expirationDate,
          },
        )
      } catch (error) {
        if (error instanceof PublicationCommitUnknownError) throw error
        try {
          await uploaded.cleanup()
        } catch (cleanupError) {
          console.error('[Publicación de oferta] No se pudieron limpiar las imágenes tras el fallo.', cleanupError)
        }
        throw error
      }
    },
    getOfertas: async () => {
      const [offerRepository, commerceRepository] = await Promise.all([offers(), commerces()])
      return getOfertas(offerRepository, commerceRepository)
    },
    getOfertasVigentes: async () => {
      const [offerRepository, commerceRepository] = await Promise.all([offers(), commerces()])
      return getOfertasVigentes(offerRepository, commerceRepository)
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
