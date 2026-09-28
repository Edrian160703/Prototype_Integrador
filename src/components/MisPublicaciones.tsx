import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CATEGORIAS, type OfertaPayload } from '../types/oferta'
import {
  deleteOferta,
  getOfertasByOwner,
  updateOferta,
  type OwnedOferta,
} from '../services/ofertaService'

interface Props {
  uid: string
}

type EditValues = {
  nombre_producto: string
  id_categoria: string
  descripcion: string
  precio_original: string
  precio_oferta: string
  cantidad_disponible: string
  horario_recojo: string
  fecha_limite: string
  imagen_url: string
}

function toLocalDateTime(value: Date): string {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function valuesFor(oferta: OwnedOferta): EditValues {
  const data = oferta.data
  return {
    nombre_producto: data.nombre_producto,
    id_categoria: data.id_categoria,
    descripcion: data.descripcion,
    precio_original: String(data.precio_original),
    precio_oferta: String(data.precio_oferta),
    cantidad_disponible: String(data.cantidad_disponible),
    horario_recojo: data.horario_recojo,
    fecha_limite: toLocalDateTime(data.fecha_limite.toDate()),
    imagen_url: data.imagen_url ?? '',
  }
}

export default function MisPublicaciones({ uid }: Props) {
  const [publicaciones, setPublicaciones] = useState<OwnedOferta[]>([])
  const [seleccionada, setSeleccionada] = useState<OwnedOferta | null>(null)
  const [values, setValues] = useState<EditValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadPublicaciones = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setPublicaciones(await getOfertasByOwner(uid))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos cargar tus publicaciones.')
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => {
    void loadPublicaciones()
  }, [loadPublicaciones])

  const selectOferta = (oferta: OwnedOferta) => {
    setSeleccionada(oferta)
    setValues(valuesFor(oferta))
    setMessage('')
    setError('')
  }

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!seleccionada || !values) return
    if (Number(values.precio_oferta) >= Number(values.precio_original)) {
      setError('El precio de oferta debe ser menor al precio original.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload: Omit<OfertaPayload, 'estado'> = {
        ...values,
        nombre_producto: values.nombre_producto.trim(),
        descripcion: values.descripcion.trim(),
        precio_original: Number(values.precio_original),
        precio_oferta: Number(values.precio_oferta),
        cantidad_disponible: Number(values.cantidad_disponible),
        horario_recojo: values.horario_recojo.trim(),
      }
      await updateOferta(seleccionada.id, uid, payload)
      setSeleccionada(null)
      setValues(null)
      setMessage('Publicación actualizada correctamente.')
      await loadPublicaciones()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la publicación.')
    } finally {
      setSaving(false)
    }
  }

  const removeOferta = async (oferta: OwnedOferta) => {
    const confirmed = window.confirm(`¿Eliminar "${oferta.data.nombre_producto}"? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    setError('')
    setMessage('')
    try {
      await deleteOferta(oferta.id, uid)
      if (seleccionada?.id === oferta.id) {
        setSeleccionada(null)
        setValues(null)
      }
      setMessage('Publicación eliminada.')
      await loadPublicaciones()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la publicación.')
    }
  }

  const updateValue = (field: keyof EditValues, value: string) => {
    setValues((current) => current ? { ...current, [field]: value } : current)
  }

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
          const category = CATEGORIAS.find((item) => item.id === oferta.data.id_categoria)
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
            <button type="button" className="btn btn-outline" onClick={() => { setSeleccionada(null); setValues(null) }}>
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
              {CATEGORIAS.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
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
            <button type="button" className="btn btn-outline" disabled={saving} onClick={() => { setSeleccionada(null); setValues(null) }}>Cancelar</button>
          </div>
        </form>
      )}
    </section>
  )
}
