import { useEffect, useState } from 'react'
import { useOfferListQuery } from '../context/ApplicationContext'
import type { OfertaConComercio } from '../types/oferta'

export default function useAdminOffers() {
  const { getOfertas } = useOfferListQuery()
  const [offers, setOffers] = useState<OfertaConComercio[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadOffers() {
      try {
        const records = await getOfertas()
        if (active) setOffers(records)
      } catch (error) {
        console.error('No se pudieron cargar las ofertas del panel administrativo.', error)
        if (active) setLoadError('No pudimos cargar las ofertas desde Firestore.')
      }
    }

    void loadOffers()
    return () => {
      active = false
    }
  }, [getOfertas])

  return { offers, loadError }
}
