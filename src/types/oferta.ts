export interface OfertaPayload {
  nombre_producto: string
  id_categoria: string
  descripcion: string
  precio_original: number
  precio_oferta: number
  cantidad_disponible: number
  horario_recojo: string
  estado: 'disponible'
  fecha_limite: string
  imagen_url: string
}

export interface OfertaDocument {
  id_producto: string
  id_comercio: string
  id_categoria: string
  nombre_producto: string
  descripcion: string
  precio_original: number
  precio_oferta: number
  cantidad_disponible: number
  horario_recojo: string
  estado: string
  fecha_limite: Date
  imagen_url: string | null
}
