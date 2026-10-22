import type { Timestamp } from 'firebase/firestore'

export interface Categoria {
  id: string
  label: string
  chip: string
}

export const CATEGORIAS: Categoria[] = [
  { id: '1', label: 'Panadería', chip: '🥐 Panaderías' },
  { id: '2', label: 'Restaurantes', chip: '🍽 Restaurantes' },
  { id: '3', label: 'Cafeterías', chip: '☕ Cafeterías' },
  { id: '4', label: 'Supermercado', chip: '🏬 Tiendas' },
  { id: '5', label: 'Pastelería', chip: '🍰 Pastelerías' },
  { id: '6', label: 'Comida rápida', chip: '🍽 Restaurantes' },
  { id: '7', label: 'Otros', chip: 'Todos' },
]

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
  fecha_limite: Timestamp
  imagen_url: string | null
}
