import type { OfertaDocument } from '../../types/oferta'
import { toDate } from './firestoreDates'

export function mapOfertaDocument(data: Record<string, unknown>): OfertaDocument {
  return {
    id_producto: String(data.id_producto ?? ''),
    id_comercio: String(data.id_comercio ?? ''),
    id_categoria: String(data.id_categoria ?? ''),
    nombre_producto: String(data.nombre_producto ?? ''),
    descripcion: String(data.descripcion ?? ''),
    precio_original: Number(data.precio_original),
    precio_oferta: Number(data.precio_oferta),
    cantidad_disponible: Number(data.cantidad_disponible),
    horario_recojo: String(data.horario_recojo ?? ''),
    estado: String(data.estado ?? '') as OfertaDocument['estado'],
    fecha_limite: toDate(data.fecha_limite),
    createdAt: data.createdAt === undefined || data.createdAt === null ? undefined : toDate(data.createdAt),
    imagen_url: typeof data.imagen_url === 'string' ? data.imagen_url : null,
    imagen_verificacion_url:
      typeof data.imagen_verificacion_url === 'string'
        ? data.imagen_verificacion_url
        : null,
  }
}
