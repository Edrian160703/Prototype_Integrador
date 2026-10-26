import type { NuevaCompra } from '../types/compra'

export type { NuevaCompra } from '../types/compra'

/** Registra una compra y devuelve su ID (COMPRA_<nombre>_<id>). */
export interface CompraRecorder {
  record(compra: NuevaCompra): Promise<string>
}
