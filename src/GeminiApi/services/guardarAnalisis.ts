import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../infrastructure/firebase/firebaseClient'
import type { EstadoAnalisis, TipoAnalisis } from '../types/analisis.types'

export async function guardarAnalisis(params: {
  usuarioId: string
  tipoAnalisis: TipoAnalisis
  rutaFotografia: string
  resultado: unknown
  estadoAnalisis: EstadoAnalisis
}): Promise<string> {
  const db = await getFirebaseFirestore()
  const ref = await addDoc(collection(db, 'analisis_ia'), {
    usuarioId: params.usuarioId,
    tipoAnalisis: params.tipoAnalisis,
    rutaFotografia: params.rutaFotografia,
    resultado: params.resultado,
    estadoAnalisis: params.estadoAnalisis,
    fechaCreacion: serverTimestamp(),
  })
  return ref.id
}