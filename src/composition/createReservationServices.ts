import {
  cancelarReserva,
  crearReservasDesdeCarrito,
  getReservasByUsuario,
} from '../application/reservas'
import type { ReservationApplication } from '../application/contracts'
import type { OfertaByIdReader } from '../ports/ofertaRepository'
import type {
  ReservaCreator,
  ReservaDeleter,
  ReservaReader,
} from '../ports/reservaRepository'
import type { CartItem } from '../types/cart'
import type { ReservaConOferta } from '../types/reserva'

type ReservationRepository = ReservaCreator & ReservaReader & ReservaDeleter

interface ReservationServiceDependencies {
  reservations: () => Promise<ReservationRepository>
  offers: () => Promise<OfertaByIdReader>
}

export function createReservationServices({
  reservations,
  offers,
}: ReservationServiceDependencies): ReservationApplication {
  return {
    crearReservasDesdeCarrito: async (
      idUsuario: string,
      emailUsuario: string,
      items: CartItem[],
    ) => crearReservasDesdeCarrito(await reservations(), idUsuario, emailUsuario, items),
    cancelarReserva: async (reserva: ReservaConOferta) =>
      cancelarReserva(await reservations(), reserva),
    getReservasByUsuario: async (idUsuario: string) => {
      const [reservationRepository, offerRepository] = await Promise.all([reservations(), offers()])
      return getReservasByUsuario(reservationRepository, offerRepository, idUsuario)
    },
  }
}
