export type EstadoRevisionVencimiento = 'aprobado' | 'rechazado' | 'requiere_revision'

export interface ResultadoVencimiento {
  nombreProducto: string
  fechaFabricacion: string | null
  fechaVencimiento: string | null
  numeroLote: string | null
  textoDetectado: string
  legibilidad: 'legible' | 'parcial' | 'ilegitible'
  nivelConfianza: number
  requiereRevision: boolean
  motivoRevision: string
  estadoRevision: EstadoRevisionVencimiento
  vencido: boolean
}