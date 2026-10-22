import type { OfertaPayload, OwnedOferta } from '../types/oferta'

export interface PublicacionEditValues {
  nombre_producto: string
  id_categoria: string
  descripcion: string
  precio_original: string
  precio_oferta: string
  cantidad_disponible: string
  horario_recojo: string
  fecha_limite: string
  imagen_url: string
}

export type PublicacionEditResult =
  | { valid: true; payload: Omit<OfertaPayload, 'estado'> }
  | { valid: false; message: string }

export function toLocalDateTime(value: Date): string {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
}

export function toPublicacionEditValues(oferta: OwnedOferta): PublicacionEditValues {
  const data = oferta.data
  return {
    nombre_producto: data.nombre_producto,
    id_categoria: data.id_categoria,
    descripcion: data.descripcion,
    precio_original: String(data.precio_original),
    precio_oferta: String(data.precio_oferta),
    cantidad_disponible: String(data.cantidad_disponible),
    horario_recojo: data.horario_recojo,
    fecha_limite: toLocalDateTime(data.fecha_limite),
    imagen_url: data.imagen_url ?? '',
  }
}

export function preparePublicacionEdit(
  values: PublicacionEditValues,
): PublicacionEditResult {
  if (Number(values.precio_oferta) >= Number(values.precio_original)) {
    return {
      valid: false,
      message: 'El precio de oferta debe ser menor al precio original.',
    }
  }

  return {
    valid: true,
    payload: {
      ...values,
      nombre_producto: values.nombre_producto.trim(),
      descripcion: values.descripcion.trim(),
      precio_original: Number(values.precio_original),
      precio_oferta: Number(values.precio_oferta),
      cantidad_disponible: Number(values.cantidad_disponible),
      horario_recojo: values.horario_recojo.trim(),
    },
  }
}
