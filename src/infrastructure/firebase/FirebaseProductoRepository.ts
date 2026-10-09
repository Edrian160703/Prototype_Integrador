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
} from 'firebase/firestore'
import { getFirebaseServices } from './firebaseClient'
import { toDate } from './firestoreDates'
import type {
  ProductoAdminRecord,
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

interface ComercioInfo {
  businessName?: string
}

export class FirebaseProductoRepository implements
  ProductoCreator,
  ProductoByCommerceReader,
  ProductoByIdReader,
  ProductoStateWriter,
  ProductoDeleter,
  ProductoAdminReader {
  async create(payload: ProductoPayload, uid: string): Promise<string> {
    const { db } = getFirebaseServices()
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

    await setDoc(doc(collection(db, 'productos'), idProducto), docData)
    return idProducto
  }

  async getByComercio(idComercio: string): Promise<ProductoDocument[]> {
    const { db } = getFirebaseServices()
    const productosQuery = query(collection(db, 'productos'), where('id_comercio', '==', idComercio))
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
    const { db } = getFirebaseServices()
    const snap = await getDoc(doc(db, 'productos', idProducto))
    if (!snap.exists()) return null
    const data = snap.data()
    return {
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as ProductoDocument
  }

  async updateEstado(idProducto: string, estado: ProductoEstado): Promise<void> {
    const { db } = getFirebaseServices()
    await updateDoc(doc(db, 'productos', idProducto), {
      estado,
      updatedAt: serverTimestamp(),
    })
  }

  async delete(idProducto: string): Promise<void> {
    const { db } = getFirebaseServices()
    await deleteDoc(doc(db, 'productos', idProducto))
  }

  async getAllForAdmin(): Promise<ProductoAdminRecord[]> {
    const { db } = getFirebaseServices()
    const snapshot = await getDocs(collection(db, 'productos'))
    const comercioCache = new Map<string, Promise<ComercioInfo | null>>()

    function resolverComercio(idComercio: string): Promise<ComercioInfo | null> {
      if (!comercioCache.has(idComercio)) {
        comercioCache.set(
          idComercio,
          getDoc(doc(db, 'comercios', idComercio)).then((snap) => (snap.exists() ? (snap.data() as ComercioInfo) : null)),
        )
      }
      return comercioCache.get(idComercio)!
    }

    return Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const storedData = docSnap.data()
        const data = {
          ...storedData,
          createdAt: toDate(storedData.createdAt),
          updatedAt: toDate(storedData.updatedAt),
        } as ProductoDocument
        const comercio = await resolverComercio(data.id_comercio)
        return { product: data, storeName: comercio?.businessName }
      }),
    )
  }
}
