import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore'
import { getFirebaseAuth } from './firebaseClient'
import type {
  ReservaAdminAuthorizer,
  ReservaAdminWriter,
  ReservaDeleter,
} from '../../ports/reservaRepository'
import type { IdGenerator } from '../../ports/idGenerator'
import type { EstadoReserva } from '../../types/reserva'
import { hasErrorCode, isReservationState } from './reservaMapper'
import {
  INVENTORY_LEDGER_COLLECTION,
  LEGACY_INVENTORY_MESSAGE,
  requireManagedInventoryPair,
} from './inventoryLedger'

/** Responsabilidad única: cambiar el estado de una reserva (confirmar, cancelar, archivar) y devolver inventario. */
export class FirebaseReservaStateChanger implements ReservaDeleter, ReservaAdminWriter {
  constructor(
    private readonly db: Firestore,
    private readonly idGenerator: IdGenerator,
    private readonly adminAuthorizer: ReservaAdminAuthorizer,
  ) {}

  async delete(idReserva: string): Promise<void> {
    await this.changeReservation(idReserva, 'cancelada', false, false)
  }

  async deleteForAdmin(idReserva: string): Promise<void> {
    await this.adminAuthorizer.assertAdmin()
    await this.changeReservation(idReserva, 'cancelada', true, true)
  }

  async updateEstado(idReserva: string, estado: EstadoReserva): Promise<void> {
    await this.adminAuthorizer.assertAdmin()
    if (!isReservationState(estado)) throw new Error('El estado solicitado para la reserva no es válido.')
    await this.changeReservation(idReserva, estado, true, false)
  }

  private async changeReservation(
    reservationId: string,
    nextState: EstadoReserva,
    admin: boolean,
    archive: boolean,
  ): Promise<void> {
    const reservationRef = doc(collection(this.db, 'reservas'), reservationId)
    const operationId = this.idGenerator.next()
    const operationRef = doc(collection(this.db, INVENTORY_LEDGER_COLLECTION), operationId)

    await runTransaction(this.db, async (transaction) => {
      const reservationSnapshot = await transaction.get(reservationRef)
      if (!reservationSnapshot.exists()) {
        if (archive) return
        throw new Error('La reserva ya no existe.')
      }
      const reservation = reservationSnapshot.data()
      const currentState = reservation.estado_reserva
      if (!isReservationState(currentState)) {
        throw new Error(`El estado de la reserva ${reservationId} no es válido.`)
      }
      if (currentState === 'cancelada') {
        if (archive && reservation.deletedAt === undefined) {
          transaction.update(reservationRef, {
            deletedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        }
        return
      }
      if (nextState === currentState && !archive) return
      if (nextState !== 'cancelada' && nextState !== 'confirmada') {
        throw new Error('La transición de estado no está permitida.')
      }
      if (nextState === 'confirmada') {
        if (currentState !== 'pendiente' || !admin) {
          throw new Error('Solo administración puede confirmar una reserva pendiente.')
        }
        transaction.update(reservationRef, {
          estado_reserva: 'confirmada',
          updatedAt: serverTimestamp(),
        })
        return
      }

      const offerId = typeof reservation.id_producto === 'string' ? reservation.id_producto : ''
      const productId = typeof reservation.id_producto_catalogo === 'string'
        ? reservation.id_producto_catalogo
        : ''
      const quantity = reservation.cantidad
      const creationOperationId = reservation.inventory_creation_operation_id
      if (
        !offerId ||
        !productId ||
        typeof creationOperationId !== 'string' ||
        !Number.isSafeInteger(quantity) ||
        (quantity as number) <= 0
      ) {
        throw new Error(LEGACY_INVENTORY_MESSAGE)
      }
      const offerRef = doc(collection(this.db, 'ofertas'), offerId)
      const productRef = doc(collection(this.db, 'productos'), productId)
      const creationOperationRef = doc(collection(this.db, INVENTORY_LEDGER_COLLECTION), creationOperationId)
      const [offerSnapshot, productSnapshot, creationOperationSnapshot] =
        await Promise.all([
          transaction.get(offerRef),
          transaction.get(productRef),
          transaction.get(creationOperationRef),
        ])
      if (!offerSnapshot.exists() || !productSnapshot.exists() || !creationOperationSnapshot.exists()) {
        throw new Error(LEGACY_INVENTORY_MESSAGE)
      }
      const creationOperation = creationOperationSnapshot.data()
      if (
        creationOperation.tipo !== 'reserva_creada' ||
        creationOperation.id_reserva !== reservationId ||
        creationOperation.id_oferta !== offerId ||
        creationOperation.id_producto !== productId ||
        creationOperation.uid !== reservation.id_usuario
      ) {
        throw new Error(LEGACY_INVENTORY_MESSAGE)
      }
      const pair = requireManagedInventoryPair(
        offerId,
        productId,
        offerSnapshot.data(),
        productSnapshot.data(),
        true,
      )
      if (
        pair.offerStock + (quantity as number) > Number.MAX_SAFE_INTEGER ||
        pair.productStock + (quantity as number) > Number.MAX_SAFE_INTEGER
      ) {
        throw new Error('La devolución excedería el límite de inventario.')
      }

      const nextProductStock = pair.productStock + (quantity as number)
      const nextOfferStock = pair.offerStock + (quantity as number)
      const actorUid = getFirebaseAuth().currentUser?.uid
      if (!actorUid) throw new Error('Debes iniciar sesión para modificar esta reserva.')
      transaction.set(operationRef, {
        tipo: 'reserva_cancelada',
        id_operacion: operationId,
        uid: actorUid,
        id_usuario_reserva: reservation.id_usuario,
        id_producto: productId,
        id_oferta: offerId,
        id_reserva: reservationId,
        cantidad: quantity,
        stock_producto_antes: pair.productStock,
        stock_producto_despues: nextProductStock,
        stock_oferta_antes: pair.offerStock,
        stock_oferta_despues: nextOfferStock,
        createdAt: serverTimestamp(),
      })
      transaction.update(productRef, {
        stock: nextProductStock,
        last_inventory_operation_id: operationId,
        updatedAt: serverTimestamp(),
      })
      transaction.update(offerRef, {
        cantidad_disponible: nextOfferStock,
        last_inventory_operation_id: operationId,
      })
      transaction.update(reservationRef, {
        estado_reserva: 'cancelada',
        inventory_last_operation_id: operationId,
        ...(archive ? { deletedAt: serverTimestamp() } : {}),
        updatedAt: serverTimestamp(),
      })
    }).catch(async (error: unknown) => {
      if (!hasErrorCode(error, 'permission-denied')) throw error
      const reservationSnapshot = await getDoc(reservationRef)
      const reservation = reservationSnapshot.data()
      if (
        reservationSnapshot.exists()
        && reservation?.estado_reserva === nextState
        && (!archive || reservation.deletedAt !== undefined)
      ) {
        return
      }
      throw error
    })
  }
}
