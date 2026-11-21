import { collection, doc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'
import type { CompraRecorder } from '../../ports/compraRepository'
import type { NamedIdGenerator } from '../../ports/idGenerator'
import type { NuevaCompra } from '../../types/compra'

export const COMPRAS_COLLECTION = 'compras'

/** Responsabilidad única: guardar en Firestore el registro de una compra. */
export class FirebaseCompraRecorder implements CompraRecorder {
  constructor(
    private readonly db: Firestore,
    private readonly purchaseIds: NamedIdGenerator,
  ) {}

  async record(compra: NuevaCompra): Promise<string> {
    if (!compra.idUsuario.trim() || !compra.emailUsuario.trim()) {
      throw new Error('Debes iniciar sesión para registrar la compra.')
    }
    if (compra.items.length === 0) throw new Error('La compra no tiene productos.')

    const purchaseId = this.purchaseIds.next(
      compra.nombreUsuario?.trim() || compra.emailUsuario.split('@')[0],
    )

    await setDoc(doc(collection(this.db, COMPRAS_COLLECTION), purchaseId), {
      id_compra: purchaseId,
      id_usuario: compra.idUsuario,
      email_usuario: compra.emailUsuario,
      nombre_cliente: compra.customer.nombre.trim(),
      dni_cliente: compra.customer.dni,
      telefono_cliente: compra.customer.telefono,
      metodo_pago: compra.metodoPago,
      estado_pago: compra.estadoPago,
      ...(compra.referenciaPago ? { referencia_pago: compra.referenciaPago } : {}),
      total: compra.total,
      cantidad_items: compra.items.reduce((sum, item) => sum + item.cantidad, 0),
      ids_reservas: compra.items.map((item) => item.id_reserva),
      items: compra.items,
      fecha_compra: serverTimestamp(),
    })

    return purchaseId
  }
}
