export interface CartItem {
  id: string
  title: string
  place: string
  /** Ubicación del local, para mostrarla al elegir pagar en tienda. */
  address?: string
  reference?: string
  image: string
  price: number
  quantity: number
  maxStock: number
}
