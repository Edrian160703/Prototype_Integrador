import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function RegistroNegocio() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Solo funcionalidad visual: no se realiza ninguna petición HTTP ni se guardan datos.
    setSent(true)
  }

  if (sent) {
    return (
      <section className="section container">
        <div className="form-card form-card-wide success-box">
          <div className="success-icon">🌱</div>
          <h2>Solicitud enviada correctamente</h2>
          <p>Nuestro equipo revisará la información de tu negocio y se pondrá en contacto contigo en menos de 24 horas.</p>
          <Link className="btn btn-primary" to="/para-negocios">Volver a Para negocios</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section container">
      <div className="form-card form-card-wide">
        <h2>Registra tu negocio 🌱</h2>
        <p>Completa el formulario y nos contactamos en menos de 24 h.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Información del negocio</div>
          <div className="field">
            <label>Nombre del negocio</label>
            <input placeholder="Ej. Panadería El Trigo" required />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Tipo de negocio</label>
              <select defaultValue="">
                <option value="" disabled>Selecciona una opción</option>
                <option>Panadería</option>
                <option>Restaurante</option>
                <option>Cafetería</option>
                <option>Pastelería</option>
                <option>Tienda</option>
              </select>
            </div>
            <div className="field">
              <label>RUC</label>
              <input placeholder="20123456789" />
            </div>
          </div>
          <div className="field">
            <label>Dirección</label>
            <input placeholder="Av. Principal 123" required />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Distrito</label>
              <input placeholder="Miraflores" required />
            </div>
            <div className="field">
              <label>Teléfono / WhatsApp</label>
              <input placeholder="+51 999 000 111" required />
            </div>
          </div>
          <div className="field">
            <label>Correo electrónico</label>
            <input type="email" placeholder="hola@tunegocio.pe" required />
          </div>

          <div className="form-section-title">Información del responsable</div>
          <div className="field-row">
            <div className="field">
              <label>Nombre del responsable</label>
              <input placeholder="Nombre" required />
            </div>
            <div className="field">
              <label>Apellidos</label>
              <input placeholder="Apellidos" required />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Teléfono</label>
              <input placeholder="+51 999 000 111" required />
            </div>
            <div className="field">
              <label>Correo</label>
              <input type="email" placeholder="responsable@correo.pe" required />
            </div>
          </div>

          <div className="form-section-title">Información adicional</div>
          <div className="field">
            <label>Horario de atención</label>
            <input placeholder="Lun a Sáb, 8:00 am - 8:00 pm" />
          </div>
          <div className="field">
            <label>Descripción del negocio</label>
            <textarea placeholder="Cuéntanos brevemente sobre tu negocio y los productos que ofreces..." />
          </div>

          <div className="terms-note">Al enviar aceptas nuestros términos de servicio</div>

          <div className="form-actions">
            <Link className="btn btn-outline btn-block" to="/para-negocios">Cancelar / Volver</Link>
            <button type="submit" className="btn btn-primary btn-block">Registrar negocio</button>
          </div>
        </form>
      </div>
    </section>
  )
}
