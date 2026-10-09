export interface CategoriaVisual {
  id: string
  label: string
  chip: string
}

export const CATEGORIAS_VISUALES: readonly CategoriaVisual[] = [
  { id: '1', label: 'Panadería', chip: '🥐 Panaderías' },
  { id: '2', label: 'Restaurantes', chip: '🍽 Restaurantes' },
  { id: '3', label: 'Cafeterías', chip: '☕ Cafeterías' },
  { id: '4', label: 'Supermercado', chip: '🏬 Tiendas' },
  { id: '5', label: 'Pastelería', chip: '🍰 Pastelerías' },
  { id: '6', label: 'Comida rápida', chip: '🍽 Restaurantes' },
  { id: '7', label: 'Otros', chip: 'Todos' },
]
