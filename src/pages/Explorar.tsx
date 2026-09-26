import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import OfferCard from '../components/OfferCard'
import useOfertas from '../hooks/useOfertas'

const filters: string[] = ['Todos', '🥐 Panaderías', '🍽 Restaurantes', '☕ Cafeterías', '🍰 Pastelerías', '🏬 Tiendas', '🌿 Saludable', '🌱 Vegano']

export default function Explorar() {
  const location = useLocation()
  const navigate = useNavigate()

  const [active, setActive] = useState<string>('Todos')
  const { offers, loading, error: loadError } = useOfertas()
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    const state = location.state as { toastMessage?: string } | null
    if (state?.toastMessage) {
      setToastMessage(state.toastMessage)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(''), 4000)
    return () => clearTimeout(timer)
  }, [toastMessage])

  const visibleOffers = active === 'Todos' ? offers : offers.filter((o) => o.categoriaChip === active)

  return (
    <>
      {toastMessage && (
        <div className="toast toast-success" role="status" aria-live="polite">
          ✓ {toastMessage}
        </div>
      )}

      <section className="search-hero">
        <div className="container">
          <h1>Explorar ofertas cerca de ti 📍</h1>
          <div className="search-box">
            <input placeholder="Buscar restaurantes, panaderías, cafeterías..." />
            <button aria-label="Buscar">⌕</button>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="categories">
          {filters.map((f) => (
            <span
              key={f}
              className={`chip${active === f ? ' active' : ''}`}
              onClick={() => setActive(f)}
            >
              {f}
            </span>
          ))}
          <span className="chip">Más cercano ⌄</span>
        </div>

        <div className="results-line"><b>{visibleOffers.length} resultados</b> cerca de Lima, Perú</div>

        {loading && <p className="explore-status">Cargando ofertas...</p>}
        {!loading && loadError && <p className="explore-status is-error">{loadError}</p>}
        {!loading && !loadError && visibleOffers.length === 0 && (
          <p className="explore-status">Todavía no hay ofertas publicadas en esta categoría.</p>
        )}

        <div className="cards-grid">
          {visibleOffers.map((o) => (
            <OfferCard key={o.id} {...o} />
          ))}
        </div>
      </section>
    </>
  )
}
