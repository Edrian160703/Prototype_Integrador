export interface OfertaFormValues {
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

export type FieldErrors = Partial<Record<keyof OfertaFormValues, string>>
export type OfertaImageMode = 'upload' | 'url'

export interface OfertaFormValidationContext {
  horarioInicio: string
  horarioFin: string
  fechaDia: string
  fechaMes: string
  fechaAnio: string
  fechaHora: string
  imageMode: OfertaImageMode
  ahoraLocal: string
}
