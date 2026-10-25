import {
  cancelarReserva,
  crearReservasDesdeCarrito,
  deleteReservaForAdmin,
  getAllReservasForAdmin,
  getReservasByUsuario,
  updateReservaEstado,
} from '../application/reservas'
import type { ReservationApplication } from '../application/contracts'
import type { OfertaByIdReader } from '../ports/ofertaRepository'
import type {
  ReservaAdminReader,
  ReservaAdminWriter,
  ReservaCreator,
  ReservaDeleter,
  ReservaReader,
} from '../ports/reservaRepository'
import type { CartItem } from '../types/cart'

type ReservationRepository =
  & ReservaCreator
  & ReservaReader
  & ReservaDeleter
  & ReservaAdminReader
  & ReservaAdminWriter

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
      nombreUsuario?: string | null,
    ) => crearReservasDesdeCarrito(await reservations(), idUsuario, emailUsuario, items, nombreUsuario),
    cancelarReserva: async (idReserva: string) =>
      cancelarReserva(await reservations(), idReserva),
    deleteReserva: async (idReserva: string) =>
      cancelarReserva(await reservations(), idReserva),
    getReservasByUsuario: async (idUsuario: string) => {
      const [reservationRepository, offerRepository] = await Promise.all([reservations(), offers()])
      return getReservasByUsuario(reservationRepository, offerRepository, idUsuario)
    },
    getAllReservasForAdmin: async () =>
      getAllReservasForAdmin(await reservations()),
    updateReservaEstado: async (idReserva, estado) =>
      updateReservaEstado(await reservations(), idReserva, estado),
    deleteReservaForAdmin: async (idReserva) =>
      deleteReservaForAdmin(await reservations(), idReserva),
  }
}
