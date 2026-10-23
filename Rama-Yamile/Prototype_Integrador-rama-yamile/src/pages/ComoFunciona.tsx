import { Link } from 'react-router-dom'
import stepBowl from '../assets/images/step-bowl.jpg'
import stepCoffee from '../assets/images/step-coffee.jpg'
import stepBakery from '../assets/images/step-bakery.jpg'
import stepCake from '../assets/images/step-cake.jpg'

interface Step {
  n: string
  icon: string
  img: string
  title: string
  desc: string
  items: string[]
}

const steps: Step[] = [
  {
    n: '01', icon: '🔎', img: stepBowl,
    title: 'Encuentra excedentes cerca de ti',
    desc: 'Explora el mapa o busca por categoría. Descubre restaurantes, panaderías, cafeterías y tiendas que tienen alimentos deliciosos en buen estado y a precios increíbles.',
    items: ['Filtra por categoría, distancia y precio', 'Ve las valoraciones de otros usuarios', 'Consulta el horario de recojo disponible'],
  },
  {
    n: '02', icon: '📱', img: stepCoffee,
    title: 'Reserva y paga de forma segura',
    desc: 'Selecciona tu pack favorito, elige la cantidad y realiza el pago de forma segura desde la app. Recibirás una confirmación inmediata con todos los detalles.',
    items: ['Pago seguro con tarjeta, Yape o Plin', 'Confirmación instantánea por WhatsApp', 'Política de cancelación flexible'],
  },
  {
    n: '03', icon: '📩', img: stepBakery,
    title: 'Recoge en el establecimiento',
    desc: 'Ve al negocio en el horario indicado y presenta tu código QR o número de reserva. El proceso es rápido, sin filas y amigable.',
    items: ['Muestra tu código QR en el local', 'Sin filas ni esperas innecesarias', 'Horarios flexibles de recojo'],
  },
  {
    n: '04', icon: '🌱', img: stepCake,
    title: 'Salva comida y ahorra dinero',
    desc: 'Disfruta de comida deliciosa con hasta un 70% de descuento y contribuye a reducir el desperdicio de alimentos. ¡Cada compra cuenta para un planeta mejor!',
    items: ['Hasta 70% de descuento en cada compra', 'Contribuyes a reducir el desperdicio', 'Sumas puntos en tu cuenta FoodBack'],
  },
]

export default function ComoFunciona() {
  return (
    <>
      <section className="dark-banner">
        <span className="pill">⚡ Simple, rápido y sostenible</span>
        <h1>¿Cómo funciona FoodBack?</h1>
        <p>En solo 4 pasos conectamos a personas que quieren ahorrar con negocios que quieren reducir su desperdicio de alimentos.</p>
      </section>

      <section className="steps container">
        {steps.map((s) => (
          <div className="step" key={s.n}>
            <div className="step-num-wrap">
              <div className="step-no">{s.n}</div>
              <div className="step-icon">{s.icon}</div>
            </div>
            <div>
              <h3>{s.icon} {s.title}</h3>
              <p>{s.desc}</p>
              <ul>
                {s.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
            {s.img ? (
              <img className="step-img" src={s.img} alt={s.title} />
            ) : (
              <div className="step-img img-placeholder">{/* //Insertar Imagen */}</div>
            )}
          </div>
        ))}
      </section>

      <section className="cta-strip">
        <div className="container cta-strip-inner">
          <div>
            <h2>¿Listo para empezar a salvar comida? 🌱</h2>
            <p>Únete a más de 15,000 usuarios que ya están ahorrando dinero y ayudando al planeta.</p>
          </div>
          <Link className="btn btn-primary" to="/explorar">Explorar ofertas ahora</Link>
        </div>
      </section>
    </>
  )
}
