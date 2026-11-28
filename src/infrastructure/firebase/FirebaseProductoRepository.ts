import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import { assertFirebaseAdmin } from './firebaseClient'
import { mapProductoDocument } from './mapProductoDocument'
import type {
  ProductoAdminReader,
  ProductoByCommerceReader,
  ProductoByIdReader,
  ProductoCreator,
  ProductoDeleter,
  ProductoStateWriter,
} from '../../ports/productoRepository'
import type {
  ProductoDocument,
  ProductoEstado,
  ProductoPayload,
} from '../../types/producto'
import { createCryptoIdGenerator } from '../cryptoIdGenerator'
import { createReadableIdGenerator } from '../readableIdGenerator'
import type { NamedIdGenerator } from '../../ports/idGenerator'

export class FirebaseProductoRepository implements
  ProductoCreator,
  ProductoByCommerceReader,
  ProductoByIdReader,
  ProductoStateWriter,
  ProductoDeleter,
  ProductoAdminReader {
  constructor(
    private readonly db: Firestore,
    private readonly idGenerator: NamedIdGenerator = createReadableIdGenerator(createCryptoIdGenerator()),
  ) {}

  async create(payload: ProductoPayload, uid: string): Promise<string> {
    if (!Number.isSafeInteger(payload.stock) || payload.stock < 0) {
      throw new Error('El stock del producto no es válido.')
    }
    const idProducto = this.idGenerator.next(payload.nombre_producto)

    const docData: Record<string, unknown> = {
      id_producto: idProducto,
      id_comercio: uid,
      id_categoria: payload.id_categoria,
      nombre_producto: payload.nombre_producto,
      descripcion: payload.descripcion,
      precio_original: payload.precio_original,
      stock: payload.stock,
      estado: payload.estado,
      imagen_url: payload.imagen_url.trim() ? payload.imagen_url : null,
      inventory_version: 1,
      inventory_offer_id: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(doc(collection(this.db, 'productos'), idProducto), docData)
    return idProducto
  }

  async rollbackUnlinked(idProducto: string, uid: string): Promise<void> {
    const productRef = doc(this.db, 'productos', idProducto)
    await runTransaction(this.db, async (transaction) => {
      const snapshot = await transaction.get(productRef)
      if (!snapshot.exists()) return

      const product = snapshot.data()
      if (
        product.id_comercio !== uid ||
        product.inventory_offer_id !== null ||
        product.archivedAt !== undefined
      ) {
        throw new Error('No se puede archivar un producto que ya está vinculado o no pertenece al comercio.')
      }

      transaction.update(productRef, {
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
  }

  async getByComercio(idComercio: string): Promise<ProductoDocument[]> {
    const productosQuery = query(collection(this.db, 'productos'), where('id_comercio', '==', idComercio))
    const snapshot = await getDocs(productosQuery)
    return snapshot.docs
      .filter((docSnap) => docSnap.data().archivedAt === undefined)
      .map((docSnap) => mapProductoDocument(docSnap.id, docSnap.data()))
  }

  async getById(idProducto: string): Promise<ProductoDocument | null> {
    const snap = await getDoc(doc(this.db, 'productos', idProducto))
    if (!snap.exists() || snap.data().archivedAt !== undefined) return null
    return mapProductoDocument(snap.id, snap.data())
  }

  async updateEstado(idProducto: string, estado: ProductoEstado): Promise<void> {
    await assertFirebaseAdmin()
    await updateDoc(doc(this.db, 'productos', idProducto), {
      estado,
      updatedAt: serverTimestamp(),
    })
  }

  async delete(idProducto: string): Promise<void> {
    await assertFirebaseAdmin()
    await updateDoc(doc(this.db, 'productos', idProducto), {
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async getAll(): Promise<ProductoDocument[]> {
    await assertFirebaseAdmin()
    const snapshot = await getDocs(collection(this.db, 'productos'))
    return snapshot.docs
      .filter((docSnap) => docSnap.data().archivedAt === undefined)
      .map((docSnap) => mapProductoDocument(docSnap.id, docSnap.data()))
  }
}
