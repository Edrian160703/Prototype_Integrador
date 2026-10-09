import useMisPublicaciones from '../hooks/useMisPublicaciones'
import { CATEGORIAS_VISUALES } from '../config/ofertaCategories'

interface Props {
  uid: string
}

function toLocalDateTime(value: Date): string {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export default function MisPublicaciones({ uid }: Props) {
  const {
    publicaciones,
    seleccionada,
    values,
    loading,
    saving,
    message,
    error,
    selectOferta,
    closeEditor,
    submitEdit,
    removeOferta,
    updateValue,
  } = useMisPublicaciones(uid)

  return (
    <section className="profile-section my-publications" aria-labelledby="my-publications-title">
      <header className="profile-section-head">
        <span className="profile-section-icon" aria-hidden="true">📦</span>
        <div>
          <h2 id="my-publications-title">Mis Publicaciones</h2>
          <p>Administra los productos publicados por tu comercio.</p>
        </div>
      </header>

      {message && <p className="profile-status is-saved" role="status">{message}</p>}
      {error && <p className="profile-status is-error" role="alert">{error}</p>}
      {loading && <p className="profile-publications-empty">Cargando publicaciones...</p>}
      {!loading && !error && publicaciones.length === 0 && (
        <p className="profile-publications-empty">Aún no has publicado productos.</p>
      )}

      <div className="profile-publication-list">
        {publicaciones.map((oferta) => {
          const category = CATEGORIAS_VISUALES.find((item) => item.id === oferta.data.id_categoria)
          return (
            <article className="profile-publication-card" key={oferta.id}>
              {oferta.data.imagen_url && (
                <img src={oferta.data.imagen_url} alt="" className="profile-publication-image" />
              )}
              <div className="profile-publication-copy">
                <span className="profile-publication-category">{category?.label ?? 'Producto'}</span>
                <h3>{oferta.data.nombre_producto}</h3>
                <p>{oferta.data.descripcion}</p>
                <strong>S/ {oferta.data.precio_oferta.toFixed(2)}</strong>
              </div>
              <div className="profile-publication-actions">
                <button type="button" className="btn btn-outline" onClick={() => selectOferta(oferta)}>
                  Modificar
                </button>
                <button type="button" className="btn btn-outline profile-delete-button" onClick={() => void removeOferta(oferta)}>
                  Eliminar
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {seleccionada && values && (
        <form className="profile-publication-editor" onSubmit={(event) => void submitEdit(event)}>
          <div className="profile-publication-editor-head">
            <h3>Modificar: {seleccionada.data.nombre_producto}</h3>
            <button type="button" className="btn btn-outline" onClick={closeEditor}>
              Cerrar
            </button>
          </div>
          <div className="field">
            <label htmlFor="edit-product-name">Nombre</label>
            <input id="edit-product-name" required maxLength={150} value={values.nombre_producto} onChange={(e) => updateValue('nombre_producto', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="edit-product-category">Categoría</label>
            <select id="edit-product-category" required value={values.id_categoria} onChange={(e) => updateValue('id_categoria', e.target.value)}>
              {CATEGORIAS_VISUALES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="edit-product-description">Descripción</label>
            <textarea id="edit-product-description" required maxLength={255} value={values.descripcion} onChange={(e) => updateValue('descripcion', e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="edit-product-original">Precio original (S/)</label>
              <input id="edit-product-original" type="number" min="0.01" step="0.01" required value={values.precio_original} onChange={(e) => updateValue('precio_original', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="edit-product-price">Precio de oferta (S/)</label>
              <input id="edit-product-price" type="number" min="0.01" step="0.01" required value={values.precio_oferta} onChange={(e) => updateValue('precio_oferta', e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="edit-product-quantity">Cantidad disponible</label>
              <input id="edit-product-quantity" type="number" min="1" step="1" required value={values.cantidad_disponible} onChange={(e) => updateValue('cantidad_disponible', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="edit-product-pickup">Horario de recojo</label>
              <input id="edit-product-pickup" required maxLength={100} value={values.horario_recojo} onChange={(e) => updateValue('horario_recojo', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="edit-product-expiration">Fecha y hora límite</label>
            <input id="edit-product-expiration" type="datetime-local" required min={toLocalDateTime(new Date())} value={values.fecha_limite} onChange={(e) => updateValue('fecha_limite', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="edit-product-image">Imagen (URL o imagen existente)</label>
            <input id="edit-product-image" value={values.imagen_url} onChange={(e) => updateValue('imagen_url', e.target.value)} />
          </div>
          <div className="profile-publication-editor-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            <button type="button" className="btn btn-outline" disabled={saving} onClick={closeEditor}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  )
}
