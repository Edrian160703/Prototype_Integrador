import type {
  ReservaCreator,
  ReservaDeleter,
  ReservaReader,
} from '../ports/reservaRepository'
import type { OfertaByIdReader } from '../ports/ofertaRepository'
import type { CartItem } from '../types/cart'
import type { ReservaDocument } from '../types/reserva'

export interface ReservaConOferta extends ReservaDocument {
  nombre_producto: string
  imagen_url: string | null
  precio_oferta: number
  horario_recojo: string
}

export function crearReserva(
  repository: ReservaCreator,
  idUsuario: string,
  emailUsuario: string,
  item: CartItem,
): Promise<string> {
  return repository.create(idUsuario, emailUsuario, item)
}

export async function crearReservasDesdeCarrito(
  repository: ReservaCreator,
  idUsuario: string,
  emailUsuario: string,
  items: CartItem[],
): Promise<string[]> {
  const idsReservas: string[] = []
  for (const item of items) {
    idsReservas.push(await repository.create(idUsuario, emailUsuario, item))
  }
  return idsReservas
}

export function cancelarReserva(repository: ReservaDeleter, reserva: ReservaConOferta): Promise<void> {
  return repository.delete(reserva.id_reserva)
}

export async function getReservasByUsuario(
  repository: ReservaReader,
  ofertas: OfertaByIdReader,
  idUsuario: string,
): Promise<ReservaConOferta[]> {
  const reservas = await repository.listByUsuario(idUsuario)
  const cache = new Map<string, Promise<Awaited<ReturnType<OfertaByIdReader['getById']>>>>()

  const enriched = await Promise.all(reservas.map(async (reserva) => {
    if (!cache.has(reserva.id_producto)) cache.set(reserva.id_producto, ofertas.getById(reserva.id_producto))
    const oferta = (await cache.get(reserva.id_producto)!)?.data
    return {
      ...reserva,
      nombre_producto: oferta?.nombre_producto ?? 'Producto ya no disponible',
      imagen_url: oferta?.imagen_url ?? null,
      precio_oferta: oferta?.precio_oferta ?? 0,
      horario_recojo: oferta?.horario_recojo ?? '',
    }
  }))

  return enriched.sort((left, right) => right.fecha_reserva.getTime() - left.fecha_reserva.getTime())
}
