import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo" style={{ color: '#fff' }}>
              <span className="logo-mark" aria-hidden="true">♻</span>
              <span>
                <span className="logo-text">FOODBACK</span>
              </span>
            </div>
            <p>Conectamos negocios y personas para salvar comida en buen estado antes de que se desperdicie.</p>
          </div>
          <div className="footer-col">
            <h4>Explorar</h4>
            <ul>
              <li><Link to="/explorar">Ofertas cerca de ti</Link></li>
              <li><Link to="/como-funciona">¿Cómo funciona?</Link></li>
              <li><Link to="/impacto">Nuestro impacto</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Negocios</h4>
            <ul>
              <li><Link to="/para-negocios">Únete como negocio</Link></li>
              <li><Link to="/registro-negocio">Registra tu negocio</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contacto</h4>
            <ul>
              <li><a href="mailto:hola@foodback.pe">hola@foodback.pe</a></li>
              <li><span>Lima, Perú</span></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} FoodBack · Buena comida, segunda oportunidad
        </div>
      </div>
    </footer>
  )
}
