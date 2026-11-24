import type {
  EstadoAnalisis,
  TipoAnalisis,
} from '../GeminiApi/types/analisis.types'

export interface SavedGeminiImage {
  ruta: string
}

export interface GeminiAnalysisRepository {
  uploadImage(
    usuarioId: string,
    tipo: TipoAnalisis,
    file: File,
  ): Promise<SavedGeminiImage>
  saveAnalysis(params: {
    usuarioId: string
    tipoAnalisis: TipoAnalisis
    rutaFotografia: string
    resultado: unknown
    estadoAnalisis: EstadoAnalisis
  }): Promise<unknown>
}
