import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Firestore,
} from 'firebase/firestore'
import { getFirebaseAuth } from './firebaseClient'
import type {
  ReservaAdminAuthorizer,
  ReservaAdminReader,
  ReservaAdminWriter,
  ReservaCreator,
  ReservaDeleter,
  ReservaReader,
} from '../../ports/reservaRepository'
import type { IdGenerator, NamedIdGenerator } from '../../ports/idGenerator'
import type { CartItem } from '../../types/cart'
import type { ReservaCheckoutDetails } from '../../types/checkout'
import type { ReservaDocument, EstadoReserva } from '../../types/reserva'
import { createCryptoIdGenerator } from '../cryptoIdGenerator'
import { createReadableIdGenerator } from '../readableIdGenerator'
import { toDate } from './firestoreDates'
import {
  assertPositiveQuantity,
  INVENTORY_LEDGER_COLLECTION,
  LEGACY_INVENTORY_MESSAGE,
  requireManagedInventoryPair,
} from './inventoryLedger'

const RESERVATION_STATES: readonly EstadoReserva[] = ['pendiente', 'confirmada', 'cancelada']
const DEFAULT_ADMIN_AUTHORIZER: ReservaAdminAuthorizer = {
  assertAdmin: async () => {
    throw new Error('Las operaciones administrativas requieren autorización.')
  },
}

function isReservationState(value: unknown): value is EstadoReserva {
  return typeof value === 'string' && RESERVATION_STATES.includes(value as EstadoReserva)
}

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === code
}

function mapReservation(documentId: string, data: Record<string, unknown>): ReservaDocument {
  const status = data.estado_reserva
  if (!isReservationState(status)) {
    throw new TypeError(`El estado de la reserva ${documentId} no es válido.`)
  }

  const quantity = data.cantidad
  if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new TypeError(`La cantidad de la reserva ${documentId} no es válida.`)
  }

  const productId = data.id_producto_catalogo
  return {
    id_reserva: typeof data.id_reserva === 'string' ? data.id_reserva : documentId,
    id_usuario: typeof data.id_usuario === 'string' ? data.id_usuario : '',
    email_usuario: typeof data.email_usuario === 'string' ? data.email_usuario : '',
    id_producto: typeof data.id_producto === 'string' ? data.id_producto : '',
    ...(typeof productId === 'string' && productId ? { id_producto_catalogo: productId } : {}),
    fecha_reserva: toDate(data.fecha_reserva),
    cantidad: quantity,
    estado_reserva: status,
  }
}

export class FirebaseReservaRepository implements
  ReservaCreator,
  ReservaReader,
  ReservaDeleter,
  ReservaAdminReader,
  ReservaAdminWriter {
  constructor(
    private readonly db: Firestore,
    private readonly idGenerator: IdGenerator = createCryptoIdGenerator(),
    private readonly adminAuthorizer: ReservaAdminAuthorizer = DEFAULT_ADMIN_AUTHORIZER,
    private readonly reservationIds: NamedIdGenerator = createReadableIdGenerator(idGenerator, 'reserva'),
  ) {}

  async create(
    idUsuario: string,
    emailUsuario: string,
    item: CartItem,
    nombreUsuario?: string | null,
    checkout?: ReservaCheckoutDetails,
  ): Promise<string> {
    if (!idUsuario.trim() || !emailUsuario.trim()) {
      throw new Error('Debes iniciar sesión para reservar.')
    }
    if (!item.id.trim()) throw new Error('Los datos de la reserva no son válidos.')
    assertPositiveQuantity(item.quantity)

    const reservationId = this.reservationIds.next(nombreUsuario?.trim() || emailUsuario.split('@')[0])
    const operationId = this.idGenerator.next()
    const reservationRef = doc(collection(this.db, 'reservas'), reservationId)
    const operationRef = doc(collection(this.db, INVENTORY_LEDGER_COLLECTION), operationId)
    const offerRef = doc(collection(this.db, 'ofertas'), item.id)

    await runTransaction(this.db, async (transaction) => {
      const offerSnapshot = await transaction.get(offerRef)
      if (!offerSnapshot.exists()) throw new Error('La oferta ya no existe.')
      const offer = offerSnapshot.data()
      const productId = typeof offer.id_producto === 'string' ? offer.id_producto : ''
      if (!productId) throw new Error(LEGACY_INVENTORY_MESSAGE)
      const productRef = doc(collection(this.db, 'productos'), productId)
      const productSnapshot = await transaction.get(productRef)
      if (!productSnapshot.exists()) throw new Error('El producto asociado ya no existe.')
      const product = productSnapshot.data()
      const pair = requireManagedInventoryPair(item.id, productId, offer, product)
      if (offer.estado !== 'disponible' || !offer.fecha_limite) {
        throw new Error('La oferta no está disponible.')
      }
      const expiry = toDate(offer.fecha_limite)
      if (expiry.getTime() <= Date.now()) throw new Error('La oferta ya venció.')
      if (product.estado !== 'activo') throw new Error('El producto no está disponible.')
      if (pair.offerStock < item.quantity || pair.productStock < item.quantity) {
        throw new Error('No hay suficientes unidades disponibles.')
      }

      const nextProductStock = pair.productStock - item.quantity
      const nextOfferStock = pair.offerStock - item.quantity
      transaction.set(operationRef, {
        tipo: 'reserva_creada',
        id_operacion: operationId,
        uid: idUsuario,
        id_producto: productId,
        id_oferta: item.id,
        id_reserva: reservationId,
        cantidad: item.quantity,
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
      transaction.set(reservationRef, {
        id_reserva: reservationId,
        id_usuario: idUsuario,
        email_usuario: emailUsuario,
        id_producto: item.id,
        id_producto_catalogo: productId,
        fecha_reserva: serverTimestamp(),
        cantidad: item.quantity,
        estado_reserva: 'pendiente',
        ...checkout,
        inventory_creation_operation_id: operationId,
        inventory_last_operation_id: operationId,
      })
    })
    return reservationId
  }

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
