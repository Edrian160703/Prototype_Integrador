import { useEffect, useState } from 'react'
import {
  useProductAdminQuery,
  useProductManagement,
} from '../context/ApplicationContext'
import type { ProductoEstado } from '../types/producto'
import type { ProductoAdminItem } from '../types/productoAdmin'
import { toProductoAdminItems } from '../presentation/ProductoPresenter'

export default function useAdminProducts() {
  const { getAllProductosForAdmin } = useProductAdminQuery()
  const { deleteProducto, updateProductoEstado } = useProductManagement()
  const [products, setProducts] = useState<ProductoAdminItem[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadProducts() {
      try {
        const productRecords = await getAllProductosForAdmin()
        if (active) setProducts(toProductoAdminItems(productRecords))
      } catch (error) {
        console.error('No se pudieron cargar los productos del panel administrativo.', error)
        if (active) setLoadError('No pudimos cargar los productos desde Firestore.')
      }
    }

    void loadProducts()
    return () => {
      active = false
    }
  }, [getAllProductosForAdmin])

  return {
    products,
    loadError,
    handleProductStatusChange: (id: string, status: ProductoEstado) =>
      updateProductoEstado(id, status),
    handleProductDelete: (id: string) => deleteProducto(id),
  }
}
