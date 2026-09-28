import { useEffect, useState } from 'react'
import { getOfertas, type OfferCardData } from '../services/ofertaService'

export default function useOfertas() {
  const [offers, setOffers] = useState<OfferCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    getOfertas()
      .then((data) => {
        if (!cancelled) setOffers(data)
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'No pudimos cargar las ofertas.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { offers, loading, error }
}
