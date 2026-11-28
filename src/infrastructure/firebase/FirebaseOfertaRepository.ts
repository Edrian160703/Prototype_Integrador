import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  type Firestore,
} from 'firebase/firestore'
import type {
  OfertaByIdReader,
  OfertaCreator,
  OfertaListReader,
  OfertaOwnerReader,
  OfertaWriter,
} from '../../ports/ofertaRepository'
import type { IdGenerator } from '../../ports/idGenerator'
import type { OfertaDocument, OfertaPayload } from '../../types/oferta'
import { createCryptoIdGenerator } from '../cryptoIdGenerator'
import { mapOfertaDocument } from './mapOfertaDocument'
import {
  assertPositiveQuantity,
  createInventoryMovement,
  INVENTORY_VERSION,
  requireManagedInventoryPair,
  validateOfferPayload,
} from './inventoryLedger'

function offerFields(payload: OfertaPayload | Omit<OfertaPayload, 'estado'>, expiry: Date) {
  return {
    nombre_producto: payload.nombre_producto.trim(),
    id_categoria: payload.id_categoria,
    descripcion: payload.descripcion.trim(),
    precio_original: payload.precio_original,
    precio_oferta: payload.precio_oferta,
    horario_recojo: payload.horario_recojo.trim(),
    fecha_limite: expiry,
    imagen_url: payload.imagen_url.trim() ? payload.imagen_url.trim() : null,
  }
}

export class FirebaseOfertaRepository implements
  OfertaCreator,
  OfertaByIdReader,
  OfertaListReader,
  OfertaOwnerReader,
  OfertaWriter {
  constructor(
    private readonly db: Firestore,
    private readonly idGenerator: IdGenerator = createCryptoIdGenerator(),
  ) {}

  async create(uid: string, payload: OfertaPayload, productId: string, offerId = productId): Promise<string> {
    const expiry = validateOfferPayload(payload)
    assertPositiveQuantity(payload.cantidad_disponible)
    const offerRef = doc(collection(this.db, 'ofertas'), offerId)
    const productRef = doc(collection(this.db, 'productos'), productId)

    await runTransaction(this.db, async (transaction) => {
      const [offerSnapshot, productSnapshot] = await Promise.all([
        transaction.get(offerRef),
        transaction.get(productRef),
      ])
      if (offerSnapshot.exists()) throw new Error('La oferta ya existe.')
      if (!productSnapshot.exists()) throw new Error('El producto asociado no existe.')
      const product = productSnapshot.data()
      if (
        product.inventory_version !== INVENTORY_VERSION ||
        product.inventory_offer_id !== null ||
        product.archivedAt !== undefined ||
        product.estado !== 'activo' ||
        product.stock !== payload.cantidad_disponible
      ) {
        throw new Error('El producto no está disponible para vincular una oferta nueva.')
      }
      const operationId = createInventoryMovement(transaction, this.db, this.idGenerator, {
        tipo: 'oferta_vinculada',
        uid,
        id_producto: productId,
        id_oferta: offerId,
        cantidad: 0,
        stock_producto_antes: product.stock,
        stock_producto_despues: product.stock,
        stock_oferta_antes: payload.cantidad_disponible,
        stock_oferta_despues: payload.cantidad_disponible,
      })
      transaction.set(offerRef, {
        ...offerFields(payload, expiry),
        estado: 'disponible',
        id_producto: productId,
        id_comercio: product.id_comercio,
        cantidad_disponible: payload.cantidad_disponible,
        inventory_version: INVENTORY_VERSION,
        last_inventory_operation_id: operationId,
      })
      transaction.update(productRef, {
        inventory_offer_id: offerId,
        last_inventory_operation_id: operationId,
        updatedAt: serverTimestamp(),
      })
    })

    return offerId
  }

  async listAll(): Promise<Array<{ id: string; data: OfertaDocument }>> {
    const snapshot = await getDocs(query(collection(this.db, 'ofertas'), orderBy('fecha_limite', 'asc')))
    return snapshot.docs
      .filter((item) => item.data().estado !== 'archivada')
      .map((item) => ({ id: item.id, data: mapOfertaDocument(item.data()) }))
  }

  async getById(id: string): Promise<{ id: string; data: OfertaDocument } | null> {
    const snapshot = await getDoc(doc(this.db, 'ofertas', id))
    return snapshot.exists() ? { id, data: mapOfertaDocument(snapshot.data()) } : null
  }

  async listByOwner(uid: string): Promise<Array<{ id: string; data: OfertaDocument }>> {
    const snapshot = await getDocs(query(collection(this.db, 'ofertas'), where('id_comercio', '==', uid)))
    return snapshot.docs
      .filter((item) => item.data().estado !== 'archivada')
      .map((item) => ({ id: item.id, data: mapOfertaDocument(item.data()) }))
      .sort((left, right) => right.data.fecha_limite.getTime() - left.data.fecha_limite.getTime())
  }

  async listByLimitDate(): Promise<Array<{ id: string; data: OfertaDocument }>> {
    const snapshot = await getDocs(query(collection(this.db, 'ofertas'), where('fecha_limite', '>', Timestamp.now())))
    return snapshot.docs
      .filter((item) => item.data().estado !== 'archivada')
      .map((item) => ({ id: item.id, data: mapOfertaDocument(item.data()) }))
      .sort((left, right) => right.data.fecha_limite.getTime() - left.data.fecha_limite.getTime())
  }

  async updateOwned(id: string, uid: string, payload: Omit<OfertaPayload, 'estado'>): Promise<void> {
    const expiry = validateOfferPayload(payload)
    assertPositiveQuantity(payload.cantidad_disponible)
    const offerRef = doc(collection(this.db, 'ofertas'), id)

    await runTransaction(this.db, async (transaction) => {
      const offerSnapshot = await transaction.get(offerRef)
      if (!offerSnapshot.exists()) throw new Error('La oferta ya no existe.')
      const offer = offerSnapshot.data()
      const productId = typeof offer.id_producto === 'string' ? offer.id_producto : ''
      if (!productId) throw new Error('La oferta heredada no tiene un producto verificable.')
      const productRef = doc(collection(this.db, 'productos'), productId)
      const productSnapshot = await transaction.get(productRef)
      if (!productSnapshot.exists()) throw new Error('El producto asociado ya no existe.')
      const pair = requireManagedInventoryPair(id, productId, offer, productSnapshot.data())

      const operationId = createInventoryMovement(transaction, this.db, this.idGenerator, {
        tipo: 'stock_ajustado',
        uid,
        id_producto: productId,
        id_oferta: id,
        cantidad: payload.cantidad_disponible,
        stock_producto_antes: pair.productStock,
        stock_producto_despues: payload.cantidad_disponible,
        stock_oferta_antes: pair.offerStock,
        stock_oferta_despues: payload.cantidad_disponible,
      })
      transaction.update(offerRef, {
        ...offerFields(payload, expiry),
        cantidad_disponible: payload.cantidad_disponible,
        last_inventory_operation_id: operationId,
      })
      transaction.update(productRef, {
        stock: payload.cantidad_disponible,
        last_inventory_operation_id: operationId,
        updatedAt: serverTimestamp(),
      })
    })
  }

  async deleteOwned(id: string, uid: string): Promise<void> {
    void uid
    const offerRef = doc(collection(this.db, 'ofertas'), id)
    await runTransaction(this.db, async (transaction) => {
      const snapshot = await transaction.get(offerRef)
      if (!snapshot.exists()) return
      transaction.update(offerRef, {
        estado: 'archivada',
        archivedAt: serverTimestamp(),
      })
    })
  }
}
