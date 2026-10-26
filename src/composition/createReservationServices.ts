import {
  cancelarReserva,
  crearReservasDesdeCarrito,
  deleteReservaForAdmin,
  getAllReservasForAdmin,
  getReservasByUsuario,
  updateReservaEstado,
} from '../application/reservas'
import { confirmarCheckout } from '../application/checkout'
import type { ReservationApplication } from '../application/contracts'
import type { CompraRecorder } from '../ports/compraRepository'
import type { OfertaByIdReader } from '../ports/ofertaRepository'
import type { PaymentGateway } from '../ports/paymentGateway'
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
  purchases: () => Promise<CompraRecorder>
  payments: PaymentGateway
}

export function createReservationServices({
  reservations,
  offers,
  purchases,
  payments,
}: ReservationServiceDependencies): ReservationApplication {
  return {
    crearReservasDesdeCarrito: async (
      idUsuario: string,
      emailUsuario: string,
      items: CartItem[],
      nombreUsuario?: string | null,
    ) => crearReservasDesdeCarrito(await reservations(), idUsuario, emailUsuario, items, nombreUsuario),
    confirmarCheckout: async (
      idUsuario: string,
      emailUsuario: string,
      items: CartItem[],
      request,
      nombreUsuario?: string | null,
    ) => confirmarCheckout(
      await reservations(),
      payments,
      idUsuario,
      emailUsuario,
      items,
      request,
      nombreUsuario,
      await purchases(),
    ),
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
