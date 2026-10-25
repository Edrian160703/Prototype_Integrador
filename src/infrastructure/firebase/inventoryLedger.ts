import {
  collection,
  doc,
  serverTimestamp,
  type Firestore,
  type Transaction,
} from 'firebase/firestore'
import type { IdGenerator } from '../../ports/idGenerator'

export const INVENTORY_LEDGER_COLLECTION = 'inventario_movimientos'
export const INVENTORY_VERSION = 1
export const LEGACY_INVENTORY_MESSAGE =
  'Esta publicación es anterior al control Spark de inventario. No se modificó nada; requiere revisión administrativa antes de habilitarla.'

export interface InventoryPair {
  productId: string
  offerId: string
  productStock: number
  offerStock: number
  commerceId: string
}

export interface InventoryMovement {
  tipo: 'oferta_vinculada' | 'reserva_creada' | 'reserva_cancelada' | 'stock_ajustado'
  uid: string
  id_producto: string
  id_oferta: string
  cantidad: number
  stock_producto_antes: number
  stock_producto_despues: number
  stock_oferta_antes: number
  stock_oferta_despues: number
  id_reserva?: string
  id_usuario_reserva?: string
  createdAt: ReturnType<typeof serverTimestamp>
}

export function assertPositiveQuantity(quantity: number): void {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error('La cantidad solicitada no es válida.')
  }
}

export function requireManagedInventoryPair(
  offerId: string,
  productId: string,
  offer: Record<string, unknown>,
  product: Record<string, unknown>,
  allowArchived = false,
): InventoryPair {
  if (
    product.inventory_version !== INVENTORY_VERSION ||
    product.inventory_offer_id !== offerId ||
    offer.inventory_version !== INVENTORY_VERSION ||
    offer.id_producto !== productId ||
    offer.id_comercio !== product.id_comercio
  ) {
    throw new Error(LEGACY_INVENTORY_MESSAGE)
  }

  const offerStock = offer.cantidad_disponible
  const productStock = product.stock
  if (
    typeof offerStock !== 'number' ||
    !Number.isSafeInteger(offerStock) ||
    offerStock < 0 ||
    typeof productStock !== 'number' ||
    !Number.isSafeInteger(productStock) ||
    productStock < 0 ||
    offerStock !== productStock
  ) {
    throw new Error('El inventario de la oferta y del producto no coincide. La operación se bloqueó sin cambios.')
  }

  if (!allowArchived && (product.archivedAt !== undefined || offer.estado === 'archivada')) {
    throw new Error('El producto o la oferta están archivados y no admiten operaciones de inventario.')
  }

  if (typeof product.id_comercio !== 'string') {
    throw new Error(LEGACY_INVENTORY_MESSAGE)
  }

  return {
    productId,
    offerId,
    productStock,
    offerStock,
    commerceId: product.id_comercio,
  }
}

export function createInventoryMovement(
  transaction: Transaction,
  db: Firestore,
  idGenerator: IdGenerator,
  movement: Omit<InventoryMovement, 'createdAt'>,
): string {
  const operationId = idGenerator.next()
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(operationId)) {
    throw new Error('No se pudo crear un identificador de inventario válido.')
  }

  transaction.set(doc(collection(db, INVENTORY_LEDGER_COLLECTION), operationId), {
    ...movement,
    id_operacion: operationId,
    createdAt: serverTimestamp(),
  })
  return operationId
}

export function validateOfferPayload(payload: {
  nombre_producto: string
  id_categoria: string
  descripcion: string
  precio_original: number
  precio_oferta: number
  cantidad_disponible: number
  horario_recojo: string
  fecha_limite: string
  imagen_url: string
}): Date {
  for (const [field, value] of Object.entries({
    nombre_producto: payload.nombre_producto,
    id_categoria: payload.id_categoria,
    descripcion: payload.descripcion,
    horario_recojo: payload.horario_recojo,
  })) {
    if (!value.trim()) throw new Error(`El campo ${field} es obligatorio.`)
  }
  if (
    !Number.isFinite(payload.precio_original) ||
    !Number.isFinite(payload.precio_oferta) ||
    payload.precio_original < 0 ||
    payload.precio_oferta < 0 ||
    payload.precio_oferta > payload.precio_original
  ) {
    throw new Error('Los precios de la oferta no son válidos.')
  }
  assertPositiveQuantity(payload.cantidad_disponible)
  const expiry = new Date(payload.fecha_limite)
  if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
    throw new Error('La fecha límite de la oferta debe ser futura.')
  }
  return expiry
}
