import { Link } from 'react-router-dom'
import OfferCard from '../components/OfferCard'
import heroBowl from '../assets/images/hero-bowl.jpg'
import cake from '../assets/images/cake.jpg'

interface Category {
  label: string
  icon: string
  active?: boolean
}

interface FeaturedOffer {
  image: string
  discount: string
  title: string
  place: string
  rating: string
  reviews: number
  distance: string
  price: string
}

const categories: Category[] = [
  { label: 'Panaderías', icon: '🥐', active: true },
  { label: 'Restaurantes', icon: '🍽' },
  { label: 'Cafeterías', icon: '☕' },
  { label: 'Pastelerías', icon: '🍰' },
  { label: 'Tiendas', icon: '🏬' },
  { label: 'Saludable', icon: '🌿' },
  { label: 'Vegano', icon: '🌱' },
  { label: 'Ver todas', icon: '⊞' },
]

const featuredOffers: FeaturedOffer[] = [
  { image: cake, discount: '-99%', title: 'Título', place: 'Lugar', rating: '4.5', reviews: 120, distance: '99.9 km', price: '99.90' },
  { image: cake, discount: '-99%', title: 'Título', place: 'Lugar', rating: '4.5', reviews: 120, distance: '99.9 km', price: '99.90' },
  { image: cake, discount: '-99%', title: 'Título', place: 'Lugar', rating: '4.5', reviews: 120, distance: '99.9 km', price: '99.90' },
]

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Salva comida, ayuda al planeta 🌱</span>
            <h1>Buena comida<br />merece una<br />segunda<br />oportunidad.</h1>
            <p>Encuentra alimentos deliciosos de restaurantes, panaderías y tiendas cercanas antes de que se desperdicien.</p>
            <div className="search-box">
              <input placeholder="Buscar comida cerca de mí ..." />
              <button aria-label="Buscar">⌕</button>
            </div>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/explorar">Explorar ofertas</Link>
              <Link className="btn btn-outline" to="/como-funciona">▶ ¿Cómo funciona?</Link>
            </div>
          </div>

          <div className="hero-art">
            <div className="hero-art-circle" aria-hidden="true" />
            <img src={heroBowl} alt="Bowl de comida preparada" />
            <div className="float-card one">
              <span className="emoji">🥖</span>
              <div>
                Pack Panadería
                <div className="fc-meta">Bonpan</div>
                <div className="fc-sub">Antes S/ 25.00</div>
                <div className="fc-price">S/ 9.90</div>
              </div>
            </div>
            <div className="float-card two">
              <span className="emoji">🍱</span>
              <div>
                Pack Sorpresa
                <div className="fc-meta">Sushi house</div>
                <div className="fc-sub">Antes S/ 25.00</div>
                <div className="fc-price">S/ 14.90 · ★ 4.5 · 1.8 km</div>
              </div>
            </div>
            <div className="badge-round">
              <div>
                <div className="heart">❤</div>
                Salva comida<br />Reduce desperdicio
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section-center-title">Categorías populares</h2>
        <div className="categories">
          {categories.map((c) => (
            <span key={c.label} className={`chip${c.active ? ' active' : ''}`}>
              {c.icon} {c.label}
            </span>
          ))}
        </div>

        <div className="section-title">
          <h2>Ofertas Destacadas</h2>
          <Link to="/explorar">Ver todas las ofertas →</Link>
        </div>
        <div className="cards-grid">
          {featuredOffers.map((o, i) => (
            <OfferCard key={i} {...o} />
          ))}
        </div>

        <div className="how-strip">
          <div>
            <strong>🌱 ¿Cómo funciona FoodBack?</strong>
          </div>
          <div><strong>1. Encuentra</strong>Descubre excedentes de comida cerca de ti.</div>
          <div><strong>2. Reserva</strong>Reserva y paga de forma segura desde la app.</div>
          <div><strong>3. Recoge</strong>Ve al establecimiento en el horario indicado y recoge.</div>
          <div><strong>4. Salva comida</strong>Ahorra dinero y ayuda a reducir el desperdicio de alimentos.</div>
        </div>
      </section>
    </>
  )
}
