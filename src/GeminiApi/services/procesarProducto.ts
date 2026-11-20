import { getFirebaseAuth } from '../../infrastructure/firebase/firebaseClient'
import type { ResultadoAlimento } from '../types/alimento.types'
import type { ResultadoVencimiento } from '../types/vencimiento.types'
import { fileToInlineData } from '../utils/convertirImagen'
import { validateImage } from '../utils/validarImagen'
import { analizarVencimiento } from './analizarVencimiento'
import { GeminiApiError } from './geminiClient'
import { guardarAnalisis } from './guardarAnalisis'
import { subirImagenAnalisis } from './subirImagen'
import { validarAlimento } from './validarAlimento'

export interface ProcesarProductoResultado {
  puedePublicarse: boolean
  alimento: ResultadoAlimento
  vencimiento: ResultadoVencimiento | null
  rutaAlimento: string
  rutaVencimiento: string | null
  mensaje: string
}

const requestWindows = new Map<string, number[]>()

function assertRequestLimit(uid: string) {
  const now = Date.now()
  const windowStart = now - 60_000
  const requests = (requestWindows.get(uid) ?? []).filter((time) => time > windowStart)
  if (requests.length >= 10) {
    throw new GeminiApiError('Has realizado demasiadas solicitudes. Espera un minuto.', 'RATE_LIMIT')
  }
  requests.push(now)
  requestWindows.set(uid, requests)
}

export async function procesarProducto(
  fotoAlimento: File,
  fotoVencimiento?: File,
): Promise<ProcesarProductoResultado> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new GeminiApiError('Debes iniciar sesión para usar el análisis.', 'UNAUTHENTICATED')
  assertRequestLimit(user.uid)

  const imageCheck = validateImage(fotoAlimento)
  if (!imageCheck.valid) throw new GeminiApiError(imageCheck.message, 'UNKNOWN')
  if (fotoVencimiento) {
    const labelCheck = validateImage(fotoVencimiento)
    if (!labelCheck.valid) throw new GeminiApiError(labelCheck.message, 'UNKNOWN')
  }

  const inlineAlimento = await fileToInlineData(fotoAlimento)
  const alimento = await validarAlimento(inlineAlimento)
  if (alimento.estadoRevision !== 'aprobado') {
    await subirImagenAnalisis(user.uid, 'alimento', fotoAlimento).then((saved) =>
      guardarAnalisis({
        usuarioId: user.uid,
        tipoAnalisis: 'alimento',
        rutaFotografia: saved.ruta,
        resultado: alimento,
        estadoAnalisis: alimento.estadoRevision,
      }),
    )
    return {
      puedePublicarse: false,
      alimento,
      vencimiento: null,
      rutaAlimento: '',
      rutaVencimiento: null,
      mensaje: alimento.estadoRevision === 'rechazado'
        ? 'La fotografía no corresponde a un alimento verificable.'
        : 'La fotografía requiere revisión manual antes de publicar.',
    }
  }

  const savedAlimento = await subirImagenAnalisis(user.uid, 'alimento', fotoAlimento)
  await guardarAnalisis({
    usuarioId: user.uid,
    tipoAnalisis: 'alimento',
    rutaFotografia: savedAlimento.ruta,
    resultado: alimento,
    estadoAnalisis: 'pendiente',
  })

  if (!fotoVencimiento) {
    return {
      puedePublicarse: false,
      alimento,
      vencimiento: null,
      rutaAlimento: savedAlimento.ruta,
      rutaVencimiento: null,
      mensaje: 'Debes adjuntar la fotografía de la etiqueta para revisar la fecha de vencimiento.',
    }
  }

  const inlineVencimiento = await fileToInlineData(fotoVencimiento)
  const vencimiento = await analizarVencimiento(inlineVencimiento)
  const savedVencimiento = await subirImagenAnalisis(user.uid, 'vencimiento', fotoVencimiento)
  await guardarAnalisis({
    usuarioId: user.uid,
    tipoAnalisis: 'vencimiento',
    rutaFotografia: savedVencimiento.ruta,
    resultado: vencimiento,
    estadoAnalisis: vencimiento.estadoRevision === 'aprobado' ? 'pendiente' : vencimiento.estadoRevision,
  })

  if (vencimiento.vencido) {
    return {
      puedePublicarse: false,
      alimento,
      vencimiento,
      rutaAlimento: savedAlimento.ruta,
      rutaVencimiento: savedVencimiento.ruta,
      mensaje: 'El producto está vencido y no puede publicarse.',
    }
  }
  if (vencimiento.requiereRevision) {
    return {
      puedePublicarse: false,
      alimento,
      vencimiento,
      rutaAlimento: savedAlimento.ruta,
      rutaVencimiento: savedVencimiento.ruta,
      mensaje: 'La fecha no es legible o requiere revisión manual del comerciante.',
    }
  }
  return {
    puedePublicarse: true,
    alimento,
    vencimiento,
    rutaAlimento: savedAlimento.ruta,
    rutaVencimiento: savedVencimiento.ruta,
    mensaje: 'El análisis fue completado. Confirma los datos antes de publicar.',
  }
}