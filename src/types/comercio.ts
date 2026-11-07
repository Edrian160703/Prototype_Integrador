export type ComercioEstado = 'activo' | 'suspendido' | 'agotado' | 'eliminado'

export interface ComercioSummary {
  businessName?: string
  district?: string
  address?: string
  reference?: string
}
