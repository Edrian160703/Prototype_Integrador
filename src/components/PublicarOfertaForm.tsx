import usePublicarOfertaForm from '../hooks/usePublicarOfertaForm'
import { CATEGORIAS_VISUALES } from '../config/ofertaCategories'
import {
  DESCRIPCION_MAX,
  IMAGEN_URL_MAX,
  normalizeDecimalOnBlur,
  NOMBRE_MAX,
} from '../utils/ofertaForm'

export default function PublicarOfertaForm() {
  const {
    form,
    horarioInicio,
    horarioFin,
    fechaDia,
    fechaMes,
    fechaAnio,
    fechaHora,
    errors,
    imageMode,
    imagePreview,
    imageError,
    fileInputRef,
    descripcionRestante,
    descuentoValido,
    porcentajeDescuento,
    status,
    statusMessage,
    saving,
    updateField,
    handleHorarioInicioChange,
    handleHorarioFinChange,
    handleFechaChange,
    handleFileChange,
    handleUrlChange,
    handlePreviewError,
    switchImageMode,
    removeImage,
    resetForm,
    handleSubmit,
  } = usePublicarOfertaForm()

  return (
    <form className="oferta-form" onSubmit={handleSubmit} noValidate>
      {/* ---------- Datos del producto ---------- */}
      <section className="profile-section" aria-labelledby="oferta-producto-title">
        <header className="profile-section-head">
          <span className="profile-section-icon" aria-hidden="true">🥐</span>
          <div>
            <h2 id="oferta-producto-title">Datos del producto</h2>
            <p>Describe el excedente que quieres ofrecer a tu comunidad.</p>
          </div>
        </header>

        <div className="field">
          <label htmlFor="oferta-nombre">Nombre del producto</label>
          <input
            id="oferta-nombre"
            value={form.nombre_producto}
            maxLength={NOMBRE_MAX}
            onChange={(event) => updateField('nombre_producto', event.target.value)}
            placeholder="Ej. Caja sorpresa de panadería"
            aria-invalid={Boolean(errors.nombre_producto)}
          />
          <div className="field-label-row">
            {errors.nombre_producto ? (
              <span className="field-error">{errors.nombre_producto}</span>
            ) : <span />}
            <small className="field-hint">{form.nombre_producto.length}/{NOMBRE_MAX}</small>
          </div>
        </div>

        <div className="field">
          <label htmlFor="oferta-categoria">Categoría</label>
          <select
            id="oferta-categoria"
            value={form.id_categoria}
            onChange={(event) => updateField('id_categoria', event.target.value)}
            aria-invalid={Boolean(errors.id_categoria)}
          >
            <option value="" disabled>Selecciona una categoría</option>
            {CATEGORIAS_VISUALES.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.label}</option>
            ))}
          </select>
          {errors.id_categoria && <span className="field-error">{errors.id_categoria}</span>}
        </div>

        <div className="field">
          <label htmlFor="oferta-descripcion">Descripción</label>
          <textarea
            id="oferta-descripcion"
            value={form.descripcion}
            maxLength={DESCRIPCION_MAX}
            onChange={(event) => updateField('descripcion', event.target.value)}
            placeholder="Cuenta qué incluye el producto, ingredientes o detalles útiles para el consumidor."
            aria-invalid={Boolean(errors.descripcion)}
          />
          <div className="field-label-row">
            {errors.descripcion ? (
              <span className="field-error">{errors.descripcion}</span>
            ) : <span />}
            <small className={`field-hint${descripcionRestante <= 20 ? ' is-low' : ''}`}>
              {descripcionRestante} caracteres restantes
            </small>
          </div>
        </div>
      </section>

      {/* ---------- Precio y disponibilidad ---------- */}
      <section className="profile-section" aria-labelledby="oferta-precio-title">
        <header className="profile-section-head">
          <span className="profile-section-icon" aria-hidden="true">💰</span>
          <div>
            <h2 id="oferta-precio-title">Precio y disponibilidad</h2>
            <p>Define el descuento y cuántas unidades tienes para ofrecer.</p>
          </div>
        </header>

        <div className="field-row">
          <div className="field">
            <label htmlFor="oferta-precio-original">Precio original (S/)</label>
            <input
              id="oferta-precio-original"
              type="text"
              inputMode="decimal"
              value={form.precio_original}
              onChange={(event) => updateField('precio_original', event.target.value)}
              onBlur={(event) => updateField('precio_original', normalizeDecimalOnBlur(event.target.value))}
              placeholder="Ej. 25.90"
              aria-invalid={Boolean(errors.precio_original)}
            />
            {errors.precio_original && <span className="field-error">{errors.precio_original}</span>}
          </div>
          <div className="field">
            <label htmlFor="oferta-precio-oferta">Precio de oferta (S/)</label>
            <input
              id="oferta-precio-oferta"
              type="text"
              inputMode="decimal"
              value={form.precio_oferta}
              onChange={(event) => updateField('precio_oferta', event.target.value)}
              onBlur={(event) => updateField('precio_oferta', normalizeDecimalOnBlur(event.target.value))}
              placeholder="Ej. 12.90"
              aria-invalid={Boolean(errors.precio_oferta)}
            />
            {errors.precio_oferta && <span className="field-error">{errors.precio_oferta}</span>}
          </div>
        </div>

        {descuentoValido && (
          <p className="oferta-descuento-tag">
            🏷️ {porcentajeDescuento}% de descuento
          </p>
        )}

        <div className="field-row">
          <div className="field">
            <label htmlFor="oferta-cantidad">Cantidad disponible</label>
            <input
              id="oferta-cantidad"
              type="text"
              inputMode="numeric"
              value={form.cantidad_disponible}
              onChange={(event) => updateField('cantidad_disponible', event.target.value.replace(/[^\d]/g, ''))}
              placeholder="Ej. 8"
              aria-invalid={Boolean(errors.cantidad_disponible)}
            />
            {errors.cantidad_disponible && <span className="field-error">{errors.cantidad_disponible}</span>}
          </div>
          <div className="field">
            <label htmlFor="oferta-estado">Estado de la publicación</label>
            <div className="oferta-estado-badge" id="oferta-estado">
              <span className="oferta-estado-dot" aria-hidden="true" /> Disponible
            </div>
            <small className="field-hint">Se activa automáticamente al publicar.</small>
          </div>
        </div>
      </section>

      {/* ---------- Recojo ---------- */}
      <section className="profile-section" aria-labelledby="oferta-recojo-title">
        <header className="profile-section-head">
          <span className="profile-section-icon" aria-hidden="true">🕒</span>
          <div>
            <h2 id="oferta-recojo-title">Recojo del pedido</h2>
            <p>Indica cuándo y hasta qué momento estará disponible esta oferta.</p>
          </div>
        </header>

        <div className="field-row">
          <div className="field">
            <label htmlFor="oferta-horario-inicio">Horario de recojo</label>
            <div className="oferta-horario-row">
              <input
                id="oferta-horario-inicio"
                type="time"
                value={horarioInicio}
                onChange={(event) => handleHorarioInicioChange(event.target.value)}
                aria-label="Hora de inicio del recojo"
                aria-invalid={Boolean(errors.horario_recojo)}
              />
              <span className="oferta-horario-separador">a</span>
              <input
                id="oferta-horario-fin"
                type="time"
                value={horarioFin}
                onChange={(event) => handleHorarioFinChange(event.target.value)}
                aria-label="Hora de fin del recojo"
                aria-invalid={Boolean(errors.horario_recojo)}
              />
            </div>
            {errors.horario_recojo && <span className="field-error">{errors.horario_recojo}</span>}
          </div>
          <div className="field">
            <label htmlFor="oferta-fecha-dia">Fecha y hora límite</label>
            <div className="oferta-fecha-row">
              <input
                id="oferta-fecha-dia"
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                placeholder="DD"
                value={fechaDia}
                onChange={(event) => handleFechaChange('dia', event.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                aria-label="Día"
                aria-invalid={Boolean(errors.fecha_limite)}
              />
              <span className="oferta-fecha-separador">/</span>
              <input
                id="oferta-fecha-mes"
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                placeholder="MM"
                value={fechaMes}
                onChange={(event) => handleFechaChange('mes', event.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                aria-label="Mes"
                aria-invalid={Boolean(errors.fecha_limite)}
              />
              <span className="oferta-fecha-separador">/</span>
              <input
                id="oferta-fecha-anio"
                type="number"
                inputMode="numeric"
                placeholder="AAAA"
                value={fechaAnio}
                onChange={(event) => handleFechaChange('anio', event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                aria-label="Año"
                aria-invalid={Boolean(errors.fecha_limite)}
              />
              <input
                id="oferta-fecha-hora"
                type="time"
                value={fechaHora}
                onChange={(event) => handleFechaChange('hora', event.target.value)}
                aria-label="Hora límite"
                aria-invalid={Boolean(errors.fecha_limite)}
              />
            </div>
            {errors.fecha_limite && <span className="field-error">{errors.fecha_limite}</span>}
          </div>
        </div>
      </section>

      {/* ---------- Imagen ---------- */}
      <section className="profile-section" aria-labelledby="oferta-imagen-title">
        <header className="profile-section-head">
          <span className="profile-section-icon" aria-hidden="true">🖼️</span>
          <div>
            <h2 id="oferta-imagen-title">Imagen del producto</h2>
            <p>Una buena foto aumenta las probabilidades de que reserven tu oferta.</p>
          </div>
        </header>

        <div className="tabs oferta-image-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`tab${imageMode === 'upload' ? ' active' : ''}`}
            aria-selected={imageMode === 'upload'}
            onClick={() => switchImageMode('upload')}
          >
            Subir imagen
          </button>
          <button
            type="button"
            role="tab"
            className={`tab${imageMode === 'url' ? ' active' : ''}`}
            aria-selected={imageMode === 'url'}
            onClick={() => switchImageMode('url')}
          >
            Usar una URL
          </button>
        </div>

        {imageMode === 'upload' ? (
          <div className="field oferta-image-field">
            <label htmlFor="oferta-imagen-file">Archivo de imagen (JPG, PNG o WEBP, máx. 5 MB)</label>
            <input
              id="oferta-imagen-file"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="field oferta-image-field">
            <label htmlFor="oferta-imagen-url">URL de la imagen</label>
            <input
              id="oferta-imagen-url"
              type="url"
              maxLength={IMAGEN_URL_MAX}
              value={form.imagen_url}
              onChange={(event) => handleUrlChange(event.target.value)}
              placeholder="https://misitio.com/imagenes/producto.jpg"
              aria-invalid={Boolean(errors.imagen_url)}
            />
            {errors.imagen_url && <span className="field-error">{errors.imagen_url}</span>}
          </div>
        )}

        {imageError && <span className="field-error">{imageError}</span>}

        {imagePreview && (
          <div className="oferta-image-preview">
            <img src={imagePreview} alt="Vista previa del producto" onError={handlePreviewError} />
            <button type="button" className="oferta-image-remove" onClick={removeImage} aria-label="Quitar imagen">×</button>
          </div>
        )}
      </section>

      <div className="profile-actions oferta-actions">
        <p
          className={`profile-status${status === 'error' ? ' is-error' : status === 'saved' ? ' is-saved' : ''}`}
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
        <div className="profile-actions-buttons">
          <button type="button" className="btn btn-outline" onClick={resetForm} disabled={saving}>
            Limpiar formulario
          </button>
          <button type="submit" className="btn btn-primary btn-publish" disabled={saving}>
            {saving ? 'Publicando...' : 'Publicar oferta'}
          </button>
        </div>
      </div>
    </form>
  )
}
