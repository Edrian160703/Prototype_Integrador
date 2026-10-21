import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
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
import type { IdGenerator } from '../../ports/idGenerator'

export class FirebaseProductoRepository implements
  ProductoCreator,
  ProductoByCommerceReader,
  ProductoByIdReader,
  ProductoStateWriter,
  ProductoDeleter,
  ProductoAdminReader {
  constructor(
    private readonly db: Firestore,
    private readonly idGenerator: IdGenerator = createCryptoIdGenerator(),
  ) {}

  async create(payload: ProductoPayload, uid: string): Promise<string> {
    const idProducto = this.idGenerator.next()

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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(doc(collection(this.db, 'productos'), idProducto), docData)
    return idProducto
  }

  async getByComercio(idComercio: string): Promise<ProductoDocument[]> {
    const productosQuery = query(collection(this.db, 'productos'), where('id_comercio', '==', idComercio))
    const snapshot = await getDocs(productosQuery)
    return snapshot.docs.map((docSnap) => mapProductoDocument(docSnap.id, docSnap.data()))
  }

  async getById(idProducto: string): Promise<ProductoDocument | null> {
    const snap = await getDoc(doc(this.db, 'productos', idProducto))
    if (!snap.exists()) return null
    return mapProductoDocument(snap.id, snap.data())
  }

  async updateEstado(idProducto: string, estado: ProductoEstado): Promise<void> {
    await updateDoc(doc(this.db, 'productos', idProducto), {
      estado,
      updatedAt: serverTimestamp(),
    })
  }

  async delete(idProducto: string): Promise<void> {
    await deleteDoc(doc(this.db, 'productos', idProducto))
  }

  async getAll(): Promise<ProductoDocument[]> {
    const snapshot = await getDocs(collection(this.db, 'productos'))
    return snapshot.docs.map((docSnap) => mapProductoDocument(docSnap.id, docSnap.data()))
  }
}
