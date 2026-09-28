import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOfertaById, type OfertaDetalle } from '../services/ofertaService'
import { useCart } from '../context/CartContext'

export default function ReservaExclusiva() {
  const { id } = useParams<{ id: string }>()
  const { addToCart } = useCart()

  const [oferta, setOferta] = useState<OfertaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadOferta() {
      if (!id) return
      setLoading(true)
      setLoadError('')
      try {
        const data = await getOfertaById(id)
        if (!cancelled) {
          setOferta(data)
          setCantidad(data && data.cantidadDisponible > 0 ? 1 : 0)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'No pudimos cargar la publicación.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOferta()
    return () => {
      cancelled = true
    }
  }, [id])

  const total = useMemo(() => (oferta ? oferta.precioOfertaNum * cantidad : 0), [oferta, cantidad])
  const sinStock = !!oferta && oferta.cantidadDisponible <= 0

  const handleAgregar = () => {
    if (!oferta || cantidad < 1) return
    addToCart(
      {
        id: oferta.id,
        title: oferta.title,
        place: oferta.place,
        image: oferta.image,
        price: oferta.precioOfertaNum,
        maxStock: oferta.cantidadDisponible,
      },
      cantidad,
    )
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2500)
  }

  return (
    <>
      <section className="reserva-hero">
        <div className="container">
          <h1>Reserva exclusiva</h1>
        </div>
      </section>

      <section className="section container reserva-exclusiva-page">
        {loading && <p className="explore-status">Cargando publicación...</p>}
        {!loading && loadError && <p className="explore-status is-error">{loadError}</p>}
        {!loading && !loadError && !oferta && (
          <p className="explore-status">No encontramos esta publicación.</p>
        )}

        {!loading && !loadError && oferta && (
          <div className="reserva-exclusiva-card">
            <div className="reserva-exclusiva-media">
              {oferta.image ? (
                <img src={oferta.image} alt={oferta.title} />
              ) : (
                <div className="reserva-exclusiva-media-placeholder" />
              )}
            </div>

            <div className="reserva-exclusiva-info">
              <Link to="/explorar" className="reserva-exclusiva-back">← Volver a explorar</Link>

              <span className="chip reserva-exclusiva-chip">{oferta.categoriaLabel}</span>
              <h2>{oferta.title}</h2>
              <div className="reserva-exclusiva-place">
                <span>{oferta.place}</span>
                <span>📍 {oferta.distance}</span>
              </div>

              <div className="reserva-exclusiva-price-row">
                <span className="reserva-exclusiva-price">S/ {oferta.price}</span>
                {oferta.discount && (
                  <>
                    <span className="reserva-exclusiva-price-old">S/ {oferta.precioOriginal.toFixed(2)}</span>
                    <span className="discount-badge">{oferta.discount}</span>
                  </>
                )}
              </div>

              <div className="reserva-exclusiva-body">
                {oferta.descripcion && (
                  <p className="reserva-exclusiva-desc">{oferta.descripcion}</p>
                )}

                <div className="reserva-exclusiva-meta">
                  <div>
                    <span className="reserva-exclusiva-meta-label">🕒 Horario de recojo</span>
                    <span>{oferta.horarioRecojo || 'A coordinar con el comercio'}</span>
                  </div>
                  <div>
                    <span className="reserva-exclusiva-meta-label">⏳ Disponible hasta</span>
                    <span>{oferta.fechaLimite}</span>
                  </div>
                </div>

                <div className="reserva-exclusiva-stock">
                  <div className="reserva-exclusiva-stock-label">
                    <span>Cantidad a reservar</span>
                    <span className="reserva-exclusiva-stock-count">
                      {sinStock ? 'Sin stock disponible' : `${oferta.cantidadDisponible} disponibles`}
                    </span>
                  </div>
                  <div className="qty-stepper">
                    <button
                      type="button"
                      onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                      disabled={sinStock || cantidad <= 1}
                      aria-label="Restar unidad"
                    >
                      −
                    </button>
                    <span>{cantidad}</span>
                    <button
                      type="button"
                      onClick={() => setCantidad((c) => Math.min(oferta.cantidadDisponible, c + 1))}
                      disabled={sinStock || cantidad >= oferta.cantidadDisponible}
                      aria-label="Sumar unidad"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="reserva-exclusiva-footer">
                <div className="reserva-exclusiva-total">
                  <span>Total</span>
                  <strong>S/ {total.toFixed(2)}</strong>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  disabled={sinStock}
                  onClick={handleAgregar}
                >
                  {sinStock ? 'Sin stock' : agregado ? 'Agregado ✓' : 'Añadir al carrito'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
