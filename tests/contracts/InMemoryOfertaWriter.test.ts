import { runOfertaWriterContract, type OfertaWriterContractFixture } from './ofertaWriterContract'
import type { OfertaWriter } from '../../src/ports/ofertaRepository'

function createInMemoryFixture(): OfertaWriterContractFixture {
  const documents = new Map<string, Record<string, unknown>>()

  const writer: OfertaWriter = {
    async updateOwned(id, uid, payload) {
      const current = documents.get(id)
      if (!current || current.id_comercio !== uid) {
        throw new Error('No tienes permiso para modificar esta publicación.')
      }
      documents.set(id, { ...current, ...payload })
    },
    async deleteOwned(id, uid) {
      const current = documents.get(id)
      if (!current || current.id_comercio !== uid) {
        throw new Error('No tienes permiso para eliminar esta publicación.')
      }
      documents.delete(id)
    },
  }

  return {
    writer,
    async seed(ownerId) {
      const id = 'offer-1'
      documents.set(id, {
        id_producto: 'product-1',
        id_comercio: ownerId,
        id_categoria: 'panaderia',
        nombre_producto: 'Pan del día',
        descripcion: 'Pan recién horneado',
        precio_original: 12,
        precio_oferta: 8,
        cantidad_disponible: 4,
        horario_recojo: '17:00 - 19:00 hs',
        estado: 'disponible',
        fecha_limite: new Date('2027-04-08T18:00:00'),
        imagen_url: null,
      })
      return id
    },
    async read(id) {
      return documents.get(id) ?? null
    },
  }
}

runOfertaWriterContract('implementación en memoria', createInMemoryFixture)
