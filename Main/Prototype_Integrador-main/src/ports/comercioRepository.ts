import type { ComercioSummary } from '../types/comercio'

export type { ComercioSummary } from '../types/comercio'

export interface ComercioReader {
  getCommerceById(id: string): Promise<ComercioSummary | null>
}
