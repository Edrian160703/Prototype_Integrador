import type { Timestamp } from 'firebase/firestore'

export type ProductoEstado = 'activo' | 'pausado' | 'agotado'

/** Datos que llegan desde el formulario al crear/editar un producto del catálogo. */
export interface ProductoPayload {
  nombre_producto: string
  id_categoria: string
  descripcion: string
  precio_original: number
  stock: number
  imagen_url: string
  estado: ProductoEstado
}

/** Forma en la que el producto vive en Firestore (coleccion "productos"). */
export interface ProductoDocument {
  id_producto: string
  id_comercio: string
  id_categoria: string
  nombre_producto: string
  descripcion: string
  precio_original: number
  stock: number
  estado: ProductoEstado
  imagen_url: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
