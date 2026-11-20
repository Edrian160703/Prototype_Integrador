import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getStorage } from 'firebase/storage'
import { getFirebaseApp } from '../../infrastructure/firebase/firebaseClient'

export interface ImagenGuardada {
  ruta: string
  urlDescargaTemporal: string
}

export async function subirImagenAnalisis(
  usuarioId: string,
  tipo: 'alimento' | 'vencimiento',
  file: File,
): Promise<ImagenGuardada> {
  const storage = getStorage(getFirebaseApp())
  const id = crypto.randomUUID()
  const ruta = `analisis_ia/${usuarioId}/${tipo}/${id}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
  const snapshot = await uploadBytes(ref(storage, ruta), file, {
    contentType: file.type,
  })
  return {
    ruta: snapshot.ref.fullPath,
    urlDescargaTemporal: await getDownloadURL(snapshot.ref),
  }
}