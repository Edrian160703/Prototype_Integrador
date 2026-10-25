import { useEffect, useState } from 'react'
import { useOfferListQuery } from '../context/ApplicationContext'
import { toOfferCardData } from '../presentation/OfertaPresenter'
import type { OfferCardData } from '../presentation/OfertaPresenter'

export default function useOfertas(soloVigentes = false) {
  const { getOfertas, getOfertasVigentes } = useOfferListQuery()
  const cargarOfertas = soloVigentes ? getOfertasVigentes : getOfertas
  const [offers, setOffers] = useState<OfferCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    cargarOfertas()
      .then((offers) => {
        if (!cancelled) setOffers(offers.map(toOfferCardData))
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
  }, [cargarOfertas])

  return { offers, loading, error }
}
