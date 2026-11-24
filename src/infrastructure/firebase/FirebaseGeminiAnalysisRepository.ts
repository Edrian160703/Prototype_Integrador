import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { getStorage, ref, uploadBytes } from 'firebase/storage'
import type { EstadoAnalisis, TipoAnalisis } from '../../GeminiApi/types/analisis.types'
import type { GeminiAnalysisRepository } from '../../ports/geminiAnalysisRepository'
import { getFirebaseApp, getFirebaseFirestore } from './firebaseClient'

export class FirebaseGeminiAnalysisRepository implements GeminiAnalysisRepository {
  async uploadImage(
    usuarioId: string,
    tipo: TipoAnalisis,
    file: File,
  ): Promise<{ ruta: string }> {
    const storage = getStorage(getFirebaseApp())
    const id = crypto.randomUUID()
    const ruta = `analisis_ia/${usuarioId}/${tipo}/${id}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
    const snapshot = await uploadBytes(ref(storage, ruta), file, {
      contentType: file.type,
    })
    return {
      ruta: snapshot.ref.fullPath,
    }
  }

  async saveAnalysis(params: {
    usuarioId: string
    tipoAnalisis: TipoAnalisis
    rutaFotografia: string
    resultado: unknown
    estadoAnalisis: EstadoAnalisis
  }): Promise<string> {
    const db = await getFirebaseFirestore()
    const reference = await addDoc(collection(db, 'analisis_ia'), {
      ...params,
      fechaCreacion: serverTimestamp(),
    })
    return reference.id
  }
}
