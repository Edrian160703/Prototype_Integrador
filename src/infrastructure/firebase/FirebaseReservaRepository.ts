import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import type {
  ReservaCreator,
  ReservaDeleter,
  ReservaReader,
} from '../../ports/reservaRepository'
import type { CartItem } from '../../types/cart'
import type { ReservaDocument } from '../../types/reserva'
import { toDate } from './firestoreDates'

function generarIdReserva(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `res_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

export class FirebaseReservaRepository implements
  ReservaCreator,
  ReservaReader,
  ReservaDeleter {
  constructor(private readonly db: Firestore) {}

  async create(idUsuario: string, emailUsuario: string, item: CartItem): Promise<string> {
    const idReserva = generarIdReserva()
    await setDoc(doc(this.db, 'reservas', idReserva), {
      id_reserva: idReserva,
      id_usuario: idUsuario,
      email_usuario: emailUsuario,
      id_producto: item.id,
      fecha_reserva: serverTimestamp(),
      cantidad: item.quantity,
      estado_reserva: 'pendiente',
    })
    return idReserva
  }

  async listByUsuario(idUsuario: string): Promise<ReservaDocument[]> {
    const snapshot = await getDocs(query(collection(this.db, 'reservas'), where('id_usuario', '==', idUsuario)))
    return snapshot.docs.map((item) => {
      const data = item.data()
      return {
        id_reserva: String(data.id_reserva ?? item.id),
        id_usuario: String(data.id_usuario ?? ''),
        email_usuario: String(data.email_usuario ?? ''),
        id_producto: String(data.id_producto ?? ''),
        fecha_reserva: toDate(data.fecha_reserva),
        cantidad: Number(data.cantidad),
        estado_reserva: data.estado_reserva === 'confirmada' || data.estado_reserva === 'cancelada'
          ? data.estado_reserva
          : 'pendiente',
      }
    })
  }

  async delete(idReserva: string): Promise<void> {
    await deleteDoc(doc(this.db, 'reservas', idReserva))
  }
}
