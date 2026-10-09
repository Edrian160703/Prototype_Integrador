import type { CartItem } from '../types/cart'
import type { ReservaDocument } from '../types/reserva'

export interface ReservaCreator {
  create(idUsuario: string, emailUsuario: string, item: CartItem): Promise<string>
}

export interface ReservaReader {
  listByUsuario(idUsuario: string): Promise<ReservaDocument[]>
}

export interface ReservaDeleter {
  delete(idReserva: string): Promise<void>
}
