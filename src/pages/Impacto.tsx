interface Stat {
  icon: string
  value: string
  label: string
}

interface Metric {
  label: string
  value: number
  cls: string
}

interface Testimonial {
  icon: string
  name: string
  role: string
  text: string
}

const stats: Stat[] = [
  { icon: '♻', value: '12,450 kg', label: 'de comida salvada en los últimos 30 días' },
  { icon: '↗', value: '8,320 kg', label: 'de CO₂ reducido, equivalente a 400 árboles' },
  { icon: '🏢', value: '340+', label: 'negocios aliados en Lima Metropolitana' },
  { icon: '👥', value: '15,200', label: 'usuarios activos y creciendo cada día' },
]

const metrics: Metric[] = [
  { label: 'Comida salvada vs. desperdiciada', value: 68, cls: '' },
  { label: 'Negocios con 0 desperdicio al cierre', value: 42, cls: 'yellow' },
  { label: 'Satisfacción de nuestros usuarios', value: 94, cls: 'blue' },
]

const testimonials: Testimonial[] = [
  { icon: '🧑', name: 'María G.', role: 'Clienta desde 2023', text: '¡Increíble! Ahorro S/ 200 al mes y como mucho mejor que antes. La app es facilísima de usar.' },
  { icon: '👨‍🍳', name: 'Carlos R.', role: 'Dueño de Panadería', text: 'Reducimos el desperdicio en un 40%. Ahora aprovechamos todo lo que producimos y generamos ingresos extras.' },
  { icon: '👩', name: 'Lucía T.', role: 'Clienta desde 2024', text: 'Me encanta saber que cada compra que hago en FoodBack ayuda al medioambiente. ¡Es ganar-ganar!' },
]

export default function Impacto() {
  return (
    <>
      <section className="impact-hero">
        <span className="eyebrow">🌍 Midiendo nuestro impacto real</span>
        <h1>Juntos estamos cambiando la forma en que Lima come</h1>
        <p>Cada compra en FoodBack salva comida en buen estado, reduce emisiones y apoya a los negocios locales de Lima.</p>
      </section>

      <section className="container">
        <div className="stats-grid">
          {stats.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <small className="stat-label">{s.label}</small>
            </div>
          ))}
        </div>

        <div className="metrics-box">
          <h2>¿Cómo medimos nuestro impacto?</h2>
          {metrics.map((m) => (
            <div className="metric" key={m.label}>
              <div className="metric-head">
                <span>{m.label}</span>
                <span>{m.value}%</span>
              </div>
              <div className="bar">
                <div className={`fill ${m.cls}`} style={{ width: `${m.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <h2 className="section-center-title">Lo que dicen nuestra comunidad</h2>
          <div className="test-grid">
            {testimonials.map((t) => (
              <article className="testimonial-card" key={t.name}>
                <div className="testimonial-head">
                  <div className="avatar-circle">{t.icon}</div>
                  <div>
                    <div className="t-name">{t.name}</div>
                    <div className="t-role">{t.role}</div>
                  </div>
                </div>
                <div className="stars">★★★★★</div>
                <p>"{t.text}"</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
