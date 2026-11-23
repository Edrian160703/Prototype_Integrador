import type { ResultadoAlimento } from '../types/alimento.types'
import type { EstadoAnalisis, TipoAnalisis } from '../types/analisis.types'
import type { ResultadoVencimiento } from '../types/vencimiento.types'
import type { ImageValidationResult } from '../utils/validarImagen'
import { isEvaluationDateCurrent } from '../utils/validarFecha'
import { GeminiApiError } from './geminiClient'

export interface ProcesarProductoResultado {
  puedePublicarse: boolean
  alimento: ResultadoAlimento
  vencimiento: ResultadoVencimiento | null
  rutaAlimento: string
  rutaVencimiento: string | null
  mensaje: string
}

export interface CurrentUserProvider {
  getUserId(): string | null
}

interface ProductImageProcessor {
  validate(file: File): ImageValidationResult
  toInlineData(file: Blob): Promise<{ mimeType: string; data: string }>
}

interface ProductAnalyzers {
  validateFood(image: { mimeType: string; data: string }): Promise<ResultadoAlimento>
  analyzeExpiration(image: { mimeType: string; data: string }): Promise<ResultadoVencimiento>
}

interface ProductAnalysisRepository {
  uploadImage(userId: string, type: TipoAnalisis, file: File): Promise<{ ruta: string }>
  saveAnalysis(params: {
    usuarioId: string
    tipoAnalisis: TipoAnalisis
    rutaFotografia: string
    resultado: unknown
    estadoAnalisis: EstadoAnalisis
  }): Promise<unknown>
}

interface ProductAnalysisDependencies {
  currentUser: CurrentUserProvider
  images: ProductImageProcessor
  analyzers: ProductAnalyzers
  repository: ProductAnalysisRepository
  clock?: () => Date
}

const requestWindows = new Map<string, number[]>()
const activeRequests = new Set<string>()

function assertRequestLimit(uid: string): void {
  const now = Date.now()
  const windowStart = now - 60_000
  const requests = (requestWindows.get(uid) ?? []).filter((time) => time > windowStart)
  if (requests.length >= 10) {
    throw new GeminiApiError('Has realizado demasiadas solicitudes. Espera un minuto.', 'RATE_LIMIT')
  }
  requests.push(now)
  requestWindows.set(uid, requests)
}

export function createProcesarProducto(dependencies: ProductAnalysisDependencies) {
  return async function procesarProducto(
    fotoAlimento: File,
    fotoVencimiento?: File,
  ): Promise<ProcesarProductoResultado> {
    const userId = dependencies.currentUser.getUserId()
    if (!userId) throw new GeminiApiError('Debes iniciar sesión para usar el análisis.', 'UNAUTHENTICATED')
    if (activeRequests.has(userId)) {
      throw new GeminiApiError('Ya tienes un análisis en proceso. Espera a que termine.', 'RATE_LIMIT')
    }
    assertRequestLimit(userId)
    activeRequests.add(userId)

    try {
      const imageCheck = dependencies.images.validate(fotoAlimento)
      if (!imageCheck.valid) throw new GeminiApiError(imageCheck.message, 'UNKNOWN')
      if (fotoVencimiento) {
        const labelCheck = dependencies.images.validate(fotoVencimiento)
        if (!labelCheck.valid) throw new GeminiApiError(labelCheck.message, 'UNKNOWN')
      }

      const inlineAlimento = await dependencies.images.toInlineData(fotoAlimento)
      const alimento = await dependencies.analyzers.validateFood(inlineAlimento)
      if (alimento.estadoRevision !== 'aprobado') {
        const saved = await dependencies.repository.uploadImage(userId, 'alimento', fotoAlimento)
        await dependencies.repository.saveAnalysis({
          usuarioId: userId,
          tipoAnalisis: 'alimento',
          rutaFotografia: saved.ruta,
          resultado: alimento,
          estadoAnalisis: alimento.estadoRevision,
        })
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

      const savedAlimento = await dependencies.repository.uploadImage(userId, 'alimento', fotoAlimento)
      await dependencies.repository.saveAnalysis({
        usuarioId: userId,
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

      const inlineVencimiento = await dependencies.images.toInlineData(fotoVencimiento)
      const vencimiento = await dependencies.analyzers.analyzeExpiration(inlineVencimiento)
      const evaluationCurrent = isEvaluationDateCurrent(
        vencimiento.fechaEvaluacion,
        dependencies.clock?.() ?? new Date(),
      )
      const savedVencimiento = await dependencies.repository.uploadImage(userId, 'vencimiento', fotoVencimiento)
      await dependencies.repository.saveAnalysis({
        usuarioId: userId,
        tipoAnalisis: 'vencimiento',
        rutaFotografia: savedVencimiento.ruta,
        resultado: vencimiento,
        estadoAnalisis: vencimiento.estadoRevision === 'aprobado' ? 'pendiente' : vencimiento.estadoRevision,
      })

      if (!evaluationCurrent) {
        return {
          puedePublicarse: false,
          alimento,
          vencimiento: {
            ...vencimiento,
            requiereRevision: true,
            motivoRevision: 'La evaluación de vencimiento está obsoleta y debe repetirse el análisis.',
            estadoRevision: 'requiere_revision',
          },
          rutaAlimento: savedAlimento.ruta,
          rutaVencimiento: savedVencimiento.ruta,
          mensaje: 'La evaluación de vencimiento está obsoleta. Solicita un nuevo análisis.',
        }
      }
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
    } finally {
      activeRequests.delete(userId)
    }
  }
}
