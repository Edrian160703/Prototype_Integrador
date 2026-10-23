import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import type {
  ReservaAdminReader,
  ReservaCreator,
  ReservaDeleter,
  ReservaReader,
  ReservaStateWriter,
} from '../../ports/reservaRepository'
import type { CartItem } from '../../types/cart'
import type { EstadoReserva, ReservaDocument } from '../../types/reserva'
import { toDate } from './firestoreDates'
import { createCryptoIdGenerator } from '../cryptoIdGenerator'
import type { IdGenerator } from '../../ports/idGenerator'

export class FirebaseReservaRepository implements
  ReservaCreator,
  ReservaReader,
  ReservaAdminReader,
  ReservaDeleter,
  ReservaStateWriter {
  constructor(
    private readonly db: Firestore,
    private readonly idGenerator: IdGenerator = createCryptoIdGenerator(),
  ) {}

  async create(idUsuario: string, emailUsuario: string, item: CartItem): Promise<string> {
    const idReserva = this.idGenerator.next()
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
    return snapshot.docs.map((item) => this.mapReserva(item.id, item.data()))
  }

  async listAll(): Promise<ReservaDocument[]> {
    const snapshot = await getDocs(collection(this.db, 'reservas'))
    return snapshot.docs.map((item) => this.mapReserva(item.id, item.data()))
  }

  async updateEstado(idReserva: string, estado: EstadoReserva): Promise<void> {
    await updateDoc(doc(this.db, 'reservas', idReserva), {
      estado_reserva: estado,
      updatedAt: serverTimestamp(),
    })
  }

  async delete(idReserva: string): Promise<void> {
    await deleteDoc(doc(this.db, 'reservas', idReserva))
  }

  private mapReserva(documentId: string, data: Record<string, unknown>): ReservaDocument {
    const status = data.estado_reserva
    if (status !== 'pendiente' && status !== 'confirmada' && status !== 'cancelada') {
      throw new TypeError(`El estado de la reserva ${documentId} no es válido.`)
    }
    const quantity = Number(data.cantidad)
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new TypeError(`La cantidad de la reserva ${documentId} no es válida.`)
    }

    return {
      id_reserva: String(data.id_reserva ?? documentId),
      id_usuario: String(data.id_usuario ?? ''),
      email_usuario: String(data.email_usuario ?? ''),
      id_producto: String(data.id_producto ?? ''),
      fecha_reserva: toDate(data.fecha_reserva),
      cantidad: quantity,
      estado_reserva: status,
    }
  }
}
