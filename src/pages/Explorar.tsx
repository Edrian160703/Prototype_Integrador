import { useState } from 'react'
import OfferCard from '../components/OfferCard'
import bakery from '../assets/images/bakery.jpg'
import bowl from '../assets/images/bowl.jpg'
import coffee from '../assets/images/coffee.jpg'
import cake2 from '../assets/images/cake2.jpg'
import seafood from '../assets/images/seafood.jpg'
import bakery2 from '../assets/images/bakery2.jpg'

interface Offer {
  image: string
  discount: string
  title: string
  place: string
  rating: string
  reviews: number
  distance: string
  price: string
}

const filters: string[] = ['Todos', '🥐 Panaderías', '🍽 Restaurantes', '☕ Cafeterías', '🍰 Pastelerías', '🏬 Tiendas', '🌿 Saludable', '🌱 Vegano']

const offers: Offer[] = [
  { image: bakery, discount: '-60%', title: 'Pack Panadería Mixto', place: 'Bonpan Miraflores', rating: '4.8', reviews: 234, distance: '1.2 km', price: '9.90' },
  { image: bowl, discount: '-61%', title: 'Bowl Proteico del Chef', place: 'Wok Fusión San Isidro', rating: '4.6', reviews: 142, distance: '2.4 km', price: '14.90' },
  { image: coffee, discount: '-58%', title: 'Pack Café + Medialunas', place: 'Café Lima Barranco', rating: '4.7', reviews: 98, distance: '0.8 km', price: '8.50' },
  { image: cake2, discount: '-65%', title: 'Torta del Día Dulcería', place: 'Dulcería Lima Centro', rating: '4.5', reviews: 390, distance: '3.1 km', price: '12.90' },
  { image: seafood, discount: '-46%', title: 'Box Mariscos Sorpresa', place: 'Cevichería El Puerto', rating: '4.9', reviews: 87, distance: '1.7 km', price: '18.90' },
  { image: bakery2, discount: '-52%', title: 'Pack Integral + Semillas', place: 'Panadería Vital', rating: '4.4', reviews: 55, distance: '2.0 km', price: '7.90' },
]

export default function Explorar() {
  const [active, setActive] = useState<string>('Todos')

  return (
    <>
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

        <div className="results-line"><b>186 resultados</b> cerca de Lima, Perú</div>

        <div className="cards-grid">
          {offers.map((o, i) => (
            <OfferCard key={i} {...o} />
          ))}
        </div>

        <div className="explore-more">
          <button className="btn btn-primary">Ver más ofertas</button>
        </div>
      </section>
    </>
  )
}
