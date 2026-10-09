import { CATEGORIAS_VISUALES } from '../config/ofertaCategories'
import type { OfertaConComercio } from '../services/ofertaService'

export interface OfferCardData {
  id: string
  image: string
  discount: string
  title: string
  place: string
  distance: string
  price: string
  categoriaChip: string
}

export interface OfertaDetalle extends OfferCardData {
  descripcion: string
  categoriaLabel: string
  cantidadDisponible: number
  horarioRecojo: string
  fechaLimite: string
  precioOriginal: number
  precioOfertaNum: number
}

function calcularDescuento(original: number, oferta: number): string {
  if (!original || original <= 0 || oferta >= original) return ''
  return `${Math.round((1 - oferta / original) * 100)}%`
}

function mapOfertaDoc({ id, data, comercio }: OfertaConComercio): OfferCardData {
  const categoria = CATEGORIAS_VISUALES.find((item) => item.id === data.id_categoria)
  return {
    id,
    image: data.imagen_url ?? '',
    discount: calcularDescuento(data.precio_original, data.precio_oferta),
    title: data.nombre_producto,
    place: comercio?.businessName || 'Comercio FoodBack',
    distance: comercio?.district || 'Lima, Perú',
    price: data.precio_oferta.toFixed(2),
    categoriaChip: categoria?.chip ?? 'Todos',
  }
}

export function toOfferCardData(offer: OfertaConComercio): OfferCardData {
  return mapOfertaDoc(offer)
}

export function toOfertaDetalle(offer: OfertaConComercio): OfertaDetalle {
  const { data } = offer
  const categoria = CATEGORIAS_VISUALES.find((item) => item.id === data.id_categoria)

  return {
    ...mapOfertaDoc(offer),
    descripcion: data.descripcion,
    categoriaLabel: categoria?.label ?? 'Otros',
    cantidadDisponible: data.cantidad_disponible,
    horarioRecojo: data.horario_recojo,
    fechaLimite: data.fecha_limite.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    precioOriginal: data.precio_original,
    precioOfertaNum: data.precio_oferta,
  }
}
