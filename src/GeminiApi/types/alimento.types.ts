export type EstadoRevisionAlimento = 'aprobado' | 'rechazado' | 'requiere_revision'

export interface ResultadoAlimento {
  esAlimento: boolean
  nombre: string
  categoria: string
  descripcion: string
  caracteristicasVisuales: string[]
  nivelConfianza: number
  motivo: string
  estadoRevision: EstadoRevisionAlimento
}