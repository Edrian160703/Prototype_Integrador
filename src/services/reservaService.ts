import { getApps, initializeApp } from 'firebase/app'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import type { CartItem } from '../types/cart'
import type { ReservaDocument } from '../types/reserva'
import type { OfertaDocument } from '../types/oferta'

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

function generarIdReserva(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `res_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

/** Crea la reserva con su cantidad. No modifica el stock de la oferta. */
export async function crearReserva(idUsuario: string, emailUsuario: string, item: CartItem): Promise<string> {
  const db = getDb()
  const idReserva = generarIdReserva()

  const docData = {
    id_reserva: idReserva,
    id_usuario: idUsuario,
    email_usuario: emailUsuario,
    id_producto: item.id,
    fecha_reserva: serverTimestamp(),
    cantidad: item.quantity,
    estado_reserva: 'pendiente',
  }

  await setDoc(doc(db, 'reservas', idReserva), docData)
  return idReserva
}

export async function crearReservasDesdeCarrito(
  idUsuario: string,
  emailUsuario: string,
  items: CartItem[],
): Promise<string[]> {
  const idsReservas: string[] = []
  // Se hace una reserva a la vez (no en paralelo) para que, si una falla por
  // falta de stock, las anteriores ya queden confirmadas y sepamos cuál fue.
  for (const item of items) {
    idsReservas.push(await crearReserva(idUsuario, emailUsuario, item))
  }
  return idsReservas
}

export interface ReservaConOferta extends ReservaDocument {
  nombre_producto: string
  imagen_url: string | null
  precio_oferta: number
  horario_recojo: string
}

/** Cancela (elimina) una reserva. No modifica el stock de la oferta. */
export async function cancelarReserva(reserva: ReservaConOferta): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, 'reservas', reserva.id_reserva))
}

/** Trae todas las reservas de un consumidor, con los datos del producto ya incluidos. */
export async function getReservasByUsuario(idUsuario: string): Promise<ReservaConOferta[]> {
  const db = getDb()
  // Se ordena en el cliente (en vez de usar orderBy en la query) para no
  // depender de crear un índice compuesto en Firestore.
  const reservasQuery = query(collection(db, 'reservas'), where('id_usuario', '==', idUsuario))
  const snapshot = await getDocs(reservasQuery)

  const cacheOfertas = new Map<string, OfertaDocument | null>()

  const reservas = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const reserva = docSnap.data() as ReservaDocument

      if (!cacheOfertas.has(reserva.id_producto)) {
        const ofertaSnap = await getDoc(doc(db, 'ofertas', reserva.id_producto))
        cacheOfertas.set(reserva.id_producto, ofertaSnap.exists() ? (ofertaSnap.data() as OfertaDocument) : null)
      }
      const oferta = cacheOfertas.get(reserva.id_producto) ?? null

      return {
        ...reserva,
        nombre_producto: oferta?.nombre_producto ?? 'Producto ya no disponible',
        imagen_url: oferta?.imagen_url ?? null,
        precio_oferta: oferta?.precio_oferta ?? 0,
        horario_recojo: oferta?.horario_recojo ?? '',
      }
    }),
  )

  return reservas.sort((a, b) => (b.fecha_reserva?.toMillis?.() ?? 0) - (a.fecha_reserva?.toMillis?.() ?? 0))
}
