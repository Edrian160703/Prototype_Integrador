import { getApps, initializeApp } from 'firebase/app'
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { CATEGORIAS, type OfertaDocument, type OfertaPayload } from '../types/oferta'

function requiredFirebaseEnv(name: string): string {
  const value = import.meta.env[name]

  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${name}`)
  }

  return value
}

function getDb() {
  const firebaseConfig = {
    apiKey: requiredFirebaseEnv('VITE_FIREBASE_API_KEY'),
    authDomain: requiredFirebaseEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requiredFirebaseEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: requiredFirebaseEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requiredFirebaseEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requiredFirebaseEnv('VITE_FIREBASE_APP_ID'),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
  return getFirestore(app)
}

function generarIdProducto(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

export interface CreateOfertaParams {
  uid: string
  payload: OfertaPayload
}

export async function createOferta({ uid, payload }: CreateOfertaParams): Promise<string> {
  const db = getDb()
  const idProducto = generarIdProducto()

  const docData: OfertaDocument = {
    id_producto: idProducto,
    id_comercio: uid,
    id_categoria: payload.id_categoria,
    nombre_producto: payload.nombre_producto,
    descripcion: payload.descripcion,
    precio_original: payload.precio_original,
    precio_oferta: payload.precio_oferta,
    cantidad_disponible: payload.cantidad_disponible,
    horario_recojo: payload.horario_recojo,
    estado: payload.estado,
    fecha_limite: Timestamp.fromDate(new Date(payload.fecha_limite)),
    imagen_url: payload.imagen_url.trim() ? payload.imagen_url : null,
  }

  await setDoc(doc(collection(db, 'ofertas'), idProducto), docData)
  return idProducto
}

export interface OfferCardData {
  id: string
  image: string
  discount: string
  title: string
  place: string
  distance: string
  price: string
  categoriaChip: string
}

function calcularDescuento(original: number, oferta: number): string {
  if (!original || original <= 0 || oferta >= original) return ''
  const pct = Math.round((1 - oferta / original) * 100)
  return pct > 0 ? `-${pct}%` : ''
}

interface ComercioInfo {
  businessName?: string
  district?: string
}

function crearResolverComercio(db: ReturnType<typeof getDb>) {
  const cache = new Map<string, Promise<ComercioInfo | null>>()

  return (idComercio: string): Promise<ComercioInfo | null> => {
    if (!cache.has(idComercio)) {
      cache.set(
        idComercio,
        getDoc(doc(db, 'comercios', idComercio)).then((snap) => (snap.exists() ? (snap.data() as ComercioInfo) : null)),
      )
    }
    return cache.get(idComercio)!
  }
}

function mapOfertaDoc(data: OfertaDocument, comercio: ComercioInfo | null): OfferCardData {
  const categoria = CATEGORIAS.find((c) => c.id === data.id_categoria)

  return {
    id: data.id_producto,
    image: data.imagen_url ?? '',
    discount: calcularDescuento(data.precio_original, data.precio_oferta),
    title: data.nombre_producto,
    place: comercio?.businessName || 'Comercio FoodBack',
    distance: comercio?.district || 'Lima, Perú',
    price: data.precio_oferta.toFixed(2),
    categoriaChip: categoria?.chip ?? 'Todos',
  }
}

export async function getOfertas(): Promise<OfferCardData[]> {
  const db = getDb()
  const ofertasQuery = query(collection(db, 'ofertas'), orderBy('fecha_limite', 'asc'))
  const snapshot = await getDocs(ofertasQuery)
  const resolverComercio = crearResolverComercio(db)

  return Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data() as OfertaDocument
      const comercio = await resolverComercio(data.id_comercio)
      return mapOfertaDoc(data, comercio)
    }),
  )
}

export interface OfertaDetalle extends OfferCardData {
  descripcion: string
  categoriaLabel: string
  cantidadDisponible: number
  horarioRecojo: string
  fechaLimite: string
  precioOriginal: number
  precioOfertaNum: number
}

function formatearFechaLimite(fechaLimite: Timestamp): string {
  return fechaLimite.toDate().toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function getOfertaById(idProducto: string): Promise<OfertaDetalle | null> {
  const db = getDb()
  const snap = await getDoc(doc(db, 'ofertas', idProducto))
  if (!snap.exists()) return null

  const data = snap.data() as OfertaDocument
  const comercioSnap = await getDoc(doc(db, 'comercios', data.id_comercio))
  const comercio = comercioSnap.exists() ? (comercioSnap.data() as ComercioInfo) : null
  const categoria = CATEGORIAS.find((c) => c.id === data.id_categoria)

  return {
    ...mapOfertaDoc(data, comercio),
    descripcion: data.descripcion,
    categoriaLabel: categoria?.label ?? 'Otros',
    cantidadDisponible: data.cantidad_disponible,
    horarioRecojo: data.horario_recojo,
    fechaLimite: formatearFechaLimite(data.fecha_limite),
    precioOriginal: data.precio_original,
    precioOfertaNum: data.precio_oferta,
  }
}

export interface OwnedOferta {
  id: string
  data: OfertaDocument
}

/** Trae todas las publicaciones (ofertas) creadas por un comercio, más recientes primero. */
export async function getOfertasByOwner(uid: string): Promise<OwnedOferta[]> {
  const db = getDb()
  const ofertasQuery = query(collection(db, 'ofertas'), where('id_comercio', '==', uid))
  const snapshot = await getDocs(ofertasQuery)

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() as OfertaDocument }))
    .sort((a, b) => (b.data.fecha_limite?.toMillis?.() ?? 0) - (a.data.fecha_limite?.toMillis?.() ?? 0))
}

/** Actualiza los datos editables de una publicación existente. Solo el dueño puede modificarla. */
export async function updateOferta(
  idProducto: string,
  uid: string,
  payload: Omit<OfertaPayload, 'estado'>,
): Promise<void> {
  const db = getDb()
  const ofertaRef = doc(db, 'ofertas', idProducto)
  const snap = await getDoc(ofertaRef)

  if (!snap.exists() || (snap.data() as OfertaDocument).id_comercio !== uid) {
    throw new Error('No tienes permiso para modificar esta publicación.')
  }

  await updateDoc(ofertaRef, {
    nombre_producto: payload.nombre_producto,
    id_categoria: payload.id_categoria,
    descripcion: payload.descripcion,
    precio_original: payload.precio_original,
    precio_oferta: payload.precio_oferta,
    cantidad_disponible: payload.cantidad_disponible,
    horario_recojo: payload.horario_recojo,
    fecha_limite: Timestamp.fromDate(new Date(payload.fecha_limite)),
    imagen_url: payload.imagen_url.trim() ? payload.imagen_url : null,
  })
}

/** Elimina una publicación. Solo el dueño puede eliminarla. */
export async function deleteOferta(idProducto: string, uid: string): Promise<void> {
  const db = getDb()
  const ofertaRef = doc(db, 'ofertas', idProducto)
  const snap = await getDoc(ofertaRef)

  if (!snap.exists() || (snap.data() as OfertaDocument).id_comercio !== uid) {
    throw new Error('No tienes permiso para eliminar esta publicación.')
  }

  await deleteDoc(ofertaRef)
}
