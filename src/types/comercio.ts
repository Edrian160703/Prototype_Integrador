export type ComercioEstado = 'activo' | 'suspendido' | 'eliminado'

export interface ComercioSummary {
  businessName?: string
  district?: string
  address?: string
  reference?: string
}
