import { getApps, initializeApp } from 'firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  runTransaction,
  serverTimestamp,
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
// Comprueba que la oferta se pueda reservar.
function validarOferta(oferta: OfertaDocument, cantidad: number): void {
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad solicitada no es válida.')
  }
  if (oferta.estado !== 'activo') {
    throw new Error('Esta oferta ya no está activa.')
  }
  const fechaLimite = oferta.fecha_limite?.toMillis?.()
  if (typeof fechaLimite !== 'number' || fechaLimite <= Date.now()) {
    throw new Error('Esta oferta ya venció.')
  }
  if (
    !Number.isSafeInteger(oferta.cantidad_disponible) ||
    oferta.cantidad_disponible < cantidad
  ) {
    throw new Error('No hay suficientes unidades disponibles.')
  }
}
/** Crea una reserva y descuenta la cantidad de la oferta. */
export async function crearReserva(
  idUsuario: string,
  emailUsuario: string,
  item: CartItem,
): Promise<string> {
  if (!idUsuario || !emailUsuario) {
    throw new Error('Debes iniciar sesión para reservar.')
  }
  if (!item.id || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
    throw new Error('Los datos de la reserva no son válidos.')
  }
  const db = getDb()
  const idReserva = generarIdReserva()
  const ofertaRef = doc(db, 'ofertas', item.id)
  const reservaRef = doc(db, 'reservas', idReserva)
  await runTransaction(db, async (transaction) => {
  const ofertaSnap = await transaction.get(ofertaRef)
  if (!ofertaSnap.exists()) {
  throw new Error('La oferta ya no está disponible.')
    }
    const oferta = ofertaSnap.data() as OfertaDocument
    validarOferta(oferta, item.quantity)
    transaction.update(ofertaRef, {
      cantidad_disponible: oferta.cantidad_disponible - item.quantity,
    })
    transaction.set(reservaRef, {
      id_reserva: idReserva,
      id_usuario: idUsuario,
      email_usuario: emailUsuario,
      id_producto: item.id,
      fecha_reserva: serverTimestamp(),
      cantidad: item.quantity,
      estado_reserva: 'pendiente',
    })
  })
  return idReserva
}
/** Procesa las reservas del carrito una por una. */
export async function crearReservasDesdeCarrito(
  idUsuario: string,
  emailUsuario: string,
  items: CartItem[],
): Promise<string[]> {
  const idsReservas: string[] = []
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
/** Cancela una reserva y devuelve las unidades disponibles. */
export async function cancelarReserva(reserva: ReservaConOferta): Promise<void> {
  const db = getDb()
  const reservaRef = doc(db, 'reservas', reserva.id_reserva)
  await runTransaction(db, async (transaction) => {
    const reservaSnap = await transaction.get(reservaRef)
    if (!reservaSnap.exists()) {
      throw new Error('La reserva ya fue cancelada o no existe.')
    }
    const reservaActual = reservaSnap.data() as ReservaDocument
    if (reservaActual.estado_reserva !== 'pendiente') {
      throw new Error('Solo puedes cancelar reservas pendientes.')
    }
    const ofertaRef = doc(db, 'ofertas', reservaActual.id_producto)
    const ofertaSnap = await transaction.get(ofertaRef)
    if (!ofertaSnap.exists()) {
      throw new Error('No se encontró la oferta de esta reserva.')
    }
    const oferta = ofertaSnap.data() as OfertaDocument
    transaction.update(ofertaRef, {
      cantidad_disponible: oferta.cantidad_disponible + reservaActual.cantidad,
    })
    transaction.delete(reservaRef)
  })
}
/** Obtiene las reservas del consumidor con los datos de sus ofertas. */
export async function getReservasByUsuario(
  idUsuario: string,
): Promise<ReservaConOferta[]> {
  const db = getDb()
  const reservasQuery = query(
    collection(db, 'reservas'),
    where('id_usuario', '==', idUsuario),
  )
  const snapshot = await getDocs(reservasQuery)
  const cacheOfertas = new Map<string, Promise<OfertaDocument | null>>()
  const reservas = await Promise.all(
  snapshot.docs.map(async (docSnap) => {
  const reserva = docSnap.data() as ReservaDocument
   if (!cacheOfertas.has(reserva.id_producto)) {
   const ofertaPromise = getDoc(
   doc(db, 'ofertas', reserva.id_producto),
    ).then((ofertaSnap) =>
    ofertaSnap.exists()
    ? (ofertaSnap.data() as OfertaDocument)
    : null,
       )
       cacheOfertas.set(reserva.id_producto, ofertaPromise)
      }
      const oferta = await cacheOfertas.get(reserva.id_producto)!
      return {
        ...reserva,
        nombre_producto: oferta?.nombre_producto ?? 'Producto ya no disponible',
        imagen_url: oferta?.imagen_url ?? null,
        precio_oferta: oferta?.precio_oferta ?? 0,
        horario_recojo: oferta?.horario_recojo ?? '',
      }
    }),
  )
  return reservas.sort(
    (a, b) =>
      (b.fecha_reserva?.toMillis?.() ?? 0) -
      (a.fecha_reserva?.toMillis?.() ?? 0),
  )
}
