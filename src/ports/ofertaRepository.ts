import type { OfertaDocument, OfertaPayload } from '../types/oferta'

export interface OfertaCreator {
  create(uid: string, payload: OfertaPayload, idProducto: string, idOferta?: string): Promise<string>
}

export interface OfertaByIdReader {
  getById(id: string): Promise<{ id: string; data: OfertaDocument } | null>
}

export interface OfertaListReader {
  listAll(): Promise<Array<{ id: string; data: OfertaDocument }>>
  listByLimitDate(): Promise<Array<{ id: string; data: OfertaDocument }>>
}

export interface OfertaOwnerReader {
  listByOwner(uid: string): Promise<Array<{ id: string; data: OfertaDocument }>>
}

export interface OfertaWriter {
  updateOwned(id: string, uid: string, payload: Omit<OfertaPayload, 'estado'>): Promise<void>
  deleteOwned(id: string, uid: string): Promise<void>
}
