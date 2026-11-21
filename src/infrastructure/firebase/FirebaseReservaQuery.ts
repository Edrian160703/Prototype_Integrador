import { collection, getDocs, query, where, type Firestore } from 'firebase/firestore'
import type {
  ReservaAdminAuthorizer,
  ReservaAdminReader,
  ReservaReader,
} from '../../ports/reservaRepository'
import type { ReservaDocument } from '../../types/reserva'
import { mapReservation } from './reservaMapper'

/** Responsabilidad única: consultar reservas (del usuario y, con autorización, todas). */
export class FirebaseReservaQuery implements ReservaReader, ReservaAdminReader {
  constructor(
    private readonly db: Firestore,
    private readonly adminAuthorizer: ReservaAdminAuthorizer,
  ) {}

  async listByUsuario(idUsuario: string): Promise<ReservaDocument[]> {
    const snapshot = await getDocs(query(collection(this.db, 'reservas'), where('id_usuario', '==', idUsuario)))
    return snapshot.docs
      .filter((item) => item.data().deletedAt === undefined)
      .map((item) => mapReservation(item.id, item.data()))
  }

  async listAll(): Promise<ReservaDocument[]> {
    await this.adminAuthorizer.assertAdmin()
    const snapshot = await getDocs(collection(this.db, 'reservas'))
    return snapshot.docs
      .filter((item) => item.data().deletedAt === undefined)
      .map((item) => mapReservation(item.id, item.data()))
      .sort((left, right) => right.fecha_reserva.getTime() - left.fecha_reserva.getTime())
  }
}
