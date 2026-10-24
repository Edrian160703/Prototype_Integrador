import type { CartItem } from '../types/cart'
import type { EstadoReserva, ReservaDocument } from '../types/reserva'

export interface ReservaCreator {
  create(idUsuario: string, emailUsuario: string, item: CartItem): Promise<string>
}

export interface ReservaReader {
  listByUsuario(idUsuario: string): Promise<ReservaDocument[]>
}

export interface ReservaDeleter {
  delete(idReserva: string): Promise<void>
}

export interface ReservaAdminAuthorizer {
  assertAdmin(): Promise<void>
}

export interface ReservaAdminReader {
  listAll(): Promise<ReservaDocument[]>
}

export interface ReservaAdminWriter {
  updateEstado(idReserva: string, estado: EstadoReserva): Promise<void>
  deleteForAdmin(idReserva: string): Promise<void>
}
