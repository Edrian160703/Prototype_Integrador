import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore'
import type { ReservaCreator } from '../../ports/reservaRepository'
import type { IdGenerator, NamedIdGenerator } from '../../ports/idGenerator'
import type { CartItem } from '../../types/cart'
import type { ReservaCheckoutDetails } from '../../types/checkout'
import { toDate } from './firestoreDates'
import {
  assertPositiveQuantity,
  INVENTORY_LEDGER_COLLECTION,
  LEGACY_INVENTORY_MESSAGE,
  requireManagedInventoryPair,
} from './inventoryLedger'

/** Responsabilidad única: crear una reserva descontando el inventario en una transacción. */
export class FirebaseReservaCreator implements ReservaCreator {
  constructor(
    private readonly db: Firestore,
    private readonly idGenerator: IdGenerator,
    private readonly reservationIds: NamedIdGenerator,
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
}
