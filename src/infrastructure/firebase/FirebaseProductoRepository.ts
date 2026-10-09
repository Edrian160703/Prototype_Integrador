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
import { toDate } from './firestoreDates'
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

function generarIdProducto(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

export class FirebaseProductoRepository implements
  ProductoCreator,
  ProductoByCommerceReader,
  ProductoByIdReader,
  ProductoStateWriter,
  ProductoDeleter,
  ProductoAdminReader {
  constructor(private readonly db: Firestore) {}

  async create(payload: ProductoPayload, uid: string): Promise<string> {
    const idProducto = generarIdProducto()

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
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as ProductoDocument
    })
  }

  async getById(idProducto: string): Promise<ProductoDocument | null> {
    const snap = await getDoc(doc(this.db, 'productos', idProducto))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as ProductoDocument
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
    return snapshot.docs.map((docSnap) => {
      const storedData = docSnap.data()
      return {
        ...storedData,
        createdAt: toDate(storedData.createdAt),
        updatedAt: toDate(storedData.updatedAt),
      } as ProductoDocument
    })
  }
}
