import { Link } from 'react-router-dom'
import chef from '../assets/images/chef.jpg'

interface Benefit {
  icon: string
  title: string
  desc: string
}

interface ProcessStep {
  n: number
  title: string
  desc: string
}

const benefits: Benefit[] = [
  { icon: '💲', title: 'Genera ingresos extras', desc: 'Convierte tus excedentes en ventas. En lugar de descartar, vende con descuento y recupera parte de tu inversión.' },
  { icon: '📊', title: 'Aumenta tu visibilidad', desc: 'Tu negocio aparece en el mapa de FoodBack y llega a miles de usuarios activos en Lima que buscan buenas ofertas.' },
  { icon: '♻', title: 'Reduce el desperdicio', desc: 'Mejora tu huella ambiental y comunica a tus clientes tu compromiso con la sostenibilidad y el planeta.' },
  { icon: '🛡', title: 'Sin riesgos ni costos fijos', desc: 'Regístrate gratis. Solo pagas una pequeña comisión por cada venta exitosa. Sin sorpresas, sin letra chica.' },
]

const process: ProcessStep[] = [
  { n: 1, title: 'Regístrate gratis', desc: 'Completa el formulario con los datos de tu negocio. Nuestro equipo lo revisará en menos de 24 horas.' },
  { n: 2, title: 'Publica tus excedentes', desc: 'Desde la app web o móvil, crea packs con tus excedentes del día, pones precio y horario de recojo.' },
  { n: 3, title: 'Recibe reservas y cobra', desc: 'Los usuarios reservan y pagan online. Tú solo preparas el pack y se lo entregas en el horario indicado.' },
]

export default function ParaNegocios() {
  return (
    <>
      <section className="container business-hero">
        <div className="business-copy">
          <span className="eyebrow">🍞 Para restaurantes, panaderías y más</span>
          <h1>Únete como negocio aliado de FoodBack</h1>
          <p>Reduce el desperdicio, genera ingresos extra y aumenta tu visibilidad ante miles de clientes en Lima. Sin costos fijos, sin complicaciones.</p>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <Link className="btn btn-primary" to="/registro-negocio">Registrar mi negocio</Link>
            <span className="free-note">◎ Gratis para empezar</span>
          </div>
        </div>
        <div className="business-img">
          <img src={chef} alt="Chef preparando alimentos" />
        </div>
      </section>

      <section className="benefits container">
        <h2 className="section-center-title">¿Por qué unirte a FoodBack?</h2>
        <p className="sub">Más de 340 negocios ya confían en nosotros para gestionar sus excedentes.</p>
        <div className="benefit-grid">
          {benefits.map((b) => (
            <article className="benefit-card" key={b.title}>
              <div className="benefit-icon">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="process">
        <div className="container">
          <h2 className="section-center-title">Cómo funciona para tu negocio</h2>
          <div className="process-grid">
            {process.map((p) => (
              <div key={p.n}>
                <div className="process-num">{p.n}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container" style={{ textAlign: 'center' }}>
        <h2>¿Listo para empezar?</h2>
        <p style={{ color: 'var(--text-gray)', marginBottom: '20px' }}>
          Completa el registro de tu negocio y nuestro equipo se pondrá en contacto contigo.
        </p>
        <Link className="btn btn-primary" to="/registro-negocio">Registrar mi negocio</Link>
      </section>
    </>
  )
}
