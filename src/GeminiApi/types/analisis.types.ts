export type TipoAnalisis = 'alimento' | 'vencimiento'
export type EstadoAnalisis = 'pendiente' | 'aprobado' | 'rechazado' | 'requiere_revision'

export interface AnalisisDocumento {
  usuarioId: string
  tipoAnalisis: TipoAnalisis
  rutaFotografia: string
  resultado: unknown
  estadoAnalisis: EstadoAnalisis
  fechaCreacion: unknown
  fechaActualizacion?: unknown
}