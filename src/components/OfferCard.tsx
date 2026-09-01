import { useState } from 'react'

interface OfferCardProps {
  image?: string
  discount?: string
  title: string
  place: string
  rating?: string
  reviews?: number
  distance: string
  price: string
}

export default function OfferCard({ image, discount, title, place, rating, reviews, distance, price }: OfferCardProps) {
  const [fav, setFav] = useState(false)

  return (
    <article className="offer-card">
      <div className="offer-card-imgwrap">
        {discount && <span className="discount-badge">{discount}</span>}
        <button
          className="fav-badge"
          aria-label="Agregar a favoritos"
          onClick={() => setFav((v) => !v)}
        >
          {fav ? '❤' : '♡'}
        </button>
        {image ? (
          <img className="offer-card-img" src={image} alt={title} />
        ) : (
          <div className="offer-card-img img-placeholder">{/* //Insertar Imagen */}</div>
        )}
      </div>
      <div className="offer-card-body">
        <div className="offer-card-title">
          <span>{title}</span>
          {rating && (
            <span className="offer-card-rating">★ {rating}{reviews ? ` (${reviews})` : ''}</span>
          )}
        </div>
        <div className="offer-card-place">{place}</div>
        <div className="offer-card-bottom">
          <span className="offer-card-dist">📍 {distance}</span>
          <span className="offer-card-price">S/ {price}</span>
        </div>
      </div>
    </article>
  )
}
