import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type {
  OfertaCreator,
  OfertaReader,
  OfertaWriter,
} from '../../ports/ofertaRepository'
import type { OfertaDocument, OfertaPayload } from '../../types/oferta'
import { getFirebaseServices } from './firebaseClient'
import { mapOfertaDocument } from './mapOfertaDocument'

function toFirestoreData(
  uid: string,
  payload: OfertaPayload,
  idProducto: string,
): Record<string, unknown> {
  return {
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
}

export class FirebaseOfertaRepository implements OfertaCreator, OfertaReader, OfertaWriter {
  async create(uid: string, payload: OfertaPayload, idProducto: string, idOferta = idProducto): Promise<string> {
    const { db } = getFirebaseServices()
    await setDoc(doc(collection(db, 'ofertas'), idOferta), toFirestoreData(uid, payload, idProducto))
    return idOferta
  }

  async listAll(): Promise<Array<{ id: string; data: OfertaDocument }>> {
    const { db } = getFirebaseServices()
    const snapshot = await getDocs(query(collection(db, 'ofertas'), orderBy('fecha_limite', 'asc')))
    return snapshot.docs.map((item) => ({ id: item.id, data: mapOfertaDocument(item.data()) }))
  }

  async getById(id: string): Promise<{ id: string; data: OfertaDocument } | null> {
    const { db } = getFirebaseServices()
    const snapshot = await getDoc(doc(db, 'ofertas', id))
    return snapshot.exists() ? { id, data: mapOfertaDocument(snapshot.data()) } : null
  }

  async listByOwner(uid: string): Promise<Array<{ id: string; data: OfertaDocument }>> {
    const { db } = getFirebaseServices()
    const snapshot = await getDocs(query(collection(db, 'ofertas'), where('id_comercio', '==', uid)))
    return snapshot.docs
      .map((item) => ({ id: item.id, data: mapOfertaDocument(item.data()) }))
      .sort((left, right) => right.data.fecha_limite.getTime() - left.data.fecha_limite.getTime())
  }

  async updateOwned(id: string, uid: string, payload: Omit<OfertaPayload, 'estado'>): Promise<void> {
    const { db } = getFirebaseServices()
    const reference = doc(db, 'ofertas', id)
    const snapshot = await getDoc(reference)
    if (!snapshot.exists() || mapOfertaDocument(snapshot.data()).id_comercio !== uid) {
      throw new Error('No tienes permiso para modificar esta publicación.')
    }
    await updateDoc(reference, {
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

  async deleteOwned(id: string, uid: string): Promise<void> {
    const { db } = getFirebaseServices()
    const reference = doc(db, 'ofertas', id)
    const snapshot = await getDoc(reference)
    if (!snapshot.exists() || mapOfertaDocument(snapshot.data()).id_comercio !== uid) {
      throw new Error('No tienes permiso para eliminar esta publicación.')
    }
    await deleteDoc(reference)
  }
}
