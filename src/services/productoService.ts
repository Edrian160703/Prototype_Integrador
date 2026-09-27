import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getFirebaseServices } from './authService'
import { CATEGORIAS, type OfertaDocument } from '../types/oferta'
import type { ProductoDocument, ProductoEstado, ProductoPayload } from '../types/producto'
import type { Product, ProductStatus } from '../components/admin/ProductsPanel'

function generarIdProducto(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

export interface CreateProductoParams {
  uid: string
  payload: ProductoPayload
}

/** Crea un producto en el catalogo del comercio (coleccion "productos"). */
export async function createProducto({ uid, payload }: CreateProductoParams): Promise<string> {
  const { db } = getFirebaseServices()
  const idProducto = generarIdProducto()

  const docData: ProductoDocument = {
    id_producto: idProducto,
    id_comercio: uid,
    id_categoria: payload.id_categoria,
    nombre_producto: payload.nombre_producto,
    descripcion: payload.descripcion,
    precio_original: payload.precio_original,
    stock: payload.stock,
    estado: payload.estado,
    imagen_url: payload.imagen_url.trim() ? payload.imagen_url : null,
    createdAt: serverTimestamp() as unknown as ProductoDocument['createdAt'],
    updatedAt: serverTimestamp() as unknown as ProductoDocument['updatedAt'],
  }

  await setDoc(doc(collection(db, 'productos'), idProducto), docData)
  return idProducto
}

/** Devuelve los productos del catalogo de un comercio especifico. */
export async function getProductosByComercio(idComercio: string): Promise<ProductoDocument[]> {
  const { db } = getFirebaseServices()
  const productosQuery = query(collection(db, 'productos'), where('id_comercio', '==', idComercio))
  const snapshot = await getDocs(productosQuery)
  return snapshot.docs.map((docSnap) => docSnap.data() as ProductoDocument)
}

export async function getProductoById(idProducto: string): Promise<ProductoDocument | null> {
  const { db } = getFirebaseServices()
  const snap = await getDoc(doc(db, 'productos', idProducto))
  return snap.exists() ? (snap.data() as ProductoDocument) : null
}

export async function updateProductoEstado(idProducto: string, estado: ProductoEstado): Promise<void> {
  const { db } = getFirebaseServices()
  await updateDoc(doc(db, 'productos', idProducto), {
    estado,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProducto(idProducto: string): Promise<void> {
  const { db } = getFirebaseServices()
  await deleteDoc(doc(db, 'productos', idProducto))
}

function toDate(value: unknown): Date {
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return value instanceof Date ? value : new Date()
}

interface ComercioInfo {
  businessName?: string
}

/**
 * Trae TODOS los productos (de todos los comercios) para el panel de administrador,
 * resolviendo el nombre del comercio y de la categoria para mostrarlos en la tabla.
 */
export async function getAllProductosForAdmin(): Promise<Product[]> {
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
      const data = docSnap.data() as ProductoDocument
      const comercio = await resolverComercio(data.id_comercio)
      const categoria = CATEGORIAS.find((c) => c.id === data.id_categoria)

      const product: Product = {
        id: data.id_producto,
        name: data.nombre_producto,
        category: categoria?.label ?? 'Otros',
        storeName: comercio?.businessName || 'Comercio FoodBack',
        price: data.precio_original,
        stock: data.stock,
        status: data.estado as ProductStatus,
        updatedAt: toDate(data.updatedAt),
      }
      return product
    }),
  )
}
