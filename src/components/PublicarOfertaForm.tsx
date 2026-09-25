import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'

/* ---------- Catálogo de categorías ---------- */
const CATEGORIAS = [
  { id: '1', label: 'Panadería' },
  { id: '2', label: 'Restaurantes' },
  { id: '3', label: 'Cafeterías' },
  { id: '4', label: 'Supermercado' },
  { id: '5', label: 'Pastelería' },
  { id: '6', label: 'Comida rápida' },
  { id: '7', label: 'Otros' },
]

const NOMBRE_MAX = 150
const DESCRIPCION_MAX = 255

interface OfertaFormValues {
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

const INITIAL_VALUES: OfertaFormValues = {
  nombre_producto: '',
  id_categoria: '',
  descripcion: '',
  precio_original: '',
  precio_oferta: '',
  cantidad_disponible: '',
  horario_recojo: '',
  fecha_limite: '',
  imagen_url: '',
}

type FieldErrors = Partial<Record<keyof OfertaFormValues, string>>
type SubmitStatus = 'idle' | 'saving' | 'saved' | 'error'

/** Convierte un archivo local en un data URL para previsualizarlo (y guardarlo como imagen_url). */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

/** Valida que el texto sea un decimal positivo con hasta 2 dígitos decimales (decimal(10,2)). */
function isValidDecimal(value: string): boolean {
  return /^\d{1,8}(\.\d{1,2})?$/.test(value.trim())
}

function isValidInteger(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

/** Redondea un texto numérico a 2 decimales al salir del campo. */
function normalizeDecimalOnBlur(value: string): string {
  const trimmed = value.trim()
  if (!trimmed || !isValidDecimal(trimmed)) return trimmed
  return Number(trimmed).toFixed(2)
}

export default function PublicarOfertaForm() {
  const [form, setForm] = useState<OfertaFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageError, setImageError] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const descripcionRestante = DESCRIPCION_MAX - form.descripcion.length
  const ahoraLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  const touch = () => {
    if (status !== 'idle') setStatus('idle')
  }

  const updateField = <K extends keyof OfertaFormValues>(field: K, value: OfertaFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    touch()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImageError('')

    if (!file.type.startsWith('image/')) {
      setImageError('Selecciona un archivo de imagen válido (JPG, PNG o WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('La imagen no debe superar los 5 MB.')
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setImagePreview(dataUrl)
      updateField('imagen_url', dataUrl)
    } catch {
      setImageError('No se pudo cargar la imagen. Intenta con otro archivo.')
    }
  }

  const handleUrlChange = (value: string) => {
    updateField('imagen_url', value)
    setImagePreview(value.trim())
    setImageError('')
  }

  const switchImageMode = (mode: 'upload' | 'url') => {
    setImageMode(mode)
    setImageError('')
    setImagePreview('')
    updateField('imagen_url', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = () => {
    setImagePreview('')
    setImageError('')
    updateField('imagen_url', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = (values: OfertaFormValues): FieldErrors => {
    const nextErrors: FieldErrors = {}

    if (!values.nombre_producto.trim()) {
      nextErrors.nombre_producto = 'Ingresa el nombre del producto.'
    } else if (values.nombre_producto.length > NOMBRE_MAX) {
      nextErrors.nombre_producto = `Máximo ${NOMBRE_MAX} caracteres.`
    }

    if (!values.id_categoria) {
      nextErrors.id_categoria = 'Selecciona una categoría.'
    }

    if (!values.descripcion.trim()) {
      nextErrors.descripcion = 'Agrega una breve descripción del producto.'
    } else if (values.descripcion.length > DESCRIPCION_MAX) {
      nextErrors.descripcion = `Máximo ${DESCRIPCION_MAX} caracteres.`
    }

    if (!values.precio_original.trim()) {
      nextErrors.precio_original = 'Ingresa el precio original.'
    } else if (!isValidDecimal(values.precio_original) || Number(values.precio_original) <= 0) {
      nextErrors.precio_original = 'Ingresa un precio válido (ej. 25.90).'
    }

    if (!values.precio_oferta.trim()) {
      nextErrors.precio_oferta = 'Ingresa el precio de oferta.'
    } else if (!isValidDecimal(values.precio_oferta) || Number(values.precio_oferta) <= 0) {
      nextErrors.precio_oferta = 'Ingresa un precio válido (ej. 12.90).'
    } else if (
      isValidDecimal(values.precio_original) &&
      Number(values.precio_oferta) >= Number(values.precio_original)
    ) {
      nextErrors.precio_oferta = 'Debe ser menor al precio original.'
    }

    if (!values.cantidad_disponible.trim()) {
      nextErrors.cantidad_disponible = 'Ingresa la cantidad disponible.'
    } else if (!isValidInteger(values.cantidad_disponible) || Number(values.cantidad_disponible) < 1) {
      nextErrors.cantidad_disponible = 'Ingresa un número entero mayor a 0.'
    }

    if (!values.horario_recojo.trim()) {
      nextErrors.horario_recojo = 'Indica el horario de recojo (ej. 18:00 - 20:00 hs).'
    }

    if (!values.fecha_limite) {
      nextErrors.fecha_limite = 'Selecciona la fecha y hora límite.'
    } else if (values.fecha_limite < ahoraLocal) {
      nextErrors.fecha_limite = 'La fecha límite debe ser posterior al momento actual.'
    }

    return nextErrors
  }

  const handleReset = () => {
    setForm(INITIAL_VALUES)
    setErrors({})
    setImagePreview('')
    setImageError('')
    setStatus('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const values: OfertaFormValues = {
      ...form,
      nombre_producto: form.nombre_producto.trim(),
      descripcion: form.descripcion.trim(),
      horario_recojo: form.horario_recojo.trim(),
      precio_original: normalizeDecimalOnBlur(form.precio_original),
      precio_oferta: normalizeDecimalOnBlur(form.precio_oferta),
    }

    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatus('error')
      setStatusMessage('Revisa los campos marcados antes de publicar.')
      return
    }

    setStatus('saving')
    setStatusMessage('')

    try {
      // Payload listo para conectarse al servicio de publicación de ofertas.
      const payload = {
        ...values,
        precio_original: Number(values.precio_original),
        precio_oferta: Number(values.precio_oferta),
        cantidad_disponible: Number(values.cantidad_disponible),
        estado: 'disponible' as const,
      }
      console.info('Nueva oferta lista para publicar:', payload)

      // Simula la latencia de guardado mientras no exista un backend conectado.
      await new Promise((resolve) => setTimeout(resolve, 700))

      setForm(INITIAL_VALUES)
      setImagePreview('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setStatus('saved')
      setStatusMessage('✓ Tu oferta fue publicada correctamente.')
    } catch (error) {
      setStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'No pudimos publicar tu oferta. Inténtalo de nuevo.')
    }
  }

  const saving = status === 'saving'

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
            {CATEGORIAS.map((categoria) => (
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

        {isValidDecimal(form.precio_original) && isValidDecimal(form.precio_oferta) &&
          Number(form.precio_oferta) < Number(form.precio_original) && (
            <p className="oferta-descuento-tag">
              🏷️ {Math.round((1 - Number(form.precio_oferta) / Number(form.precio_original)) * 100)}% de descuento
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
            <label htmlFor="oferta-horario">Horario de recojo</label>
            <input
              id="oferta-horario"
              value={form.horario_recojo}
              onChange={(event) => updateField('horario_recojo', event.target.value)}
              placeholder="Ej. 18:00 - 20:00 hs"
              aria-invalid={Boolean(errors.horario_recojo)}
            />
            {errors.horario_recojo && <span className="field-error">{errors.horario_recojo}</span>}
          </div>
          <div className="field">
            <label htmlFor="oferta-fecha-limite">Fecha y hora límite</label>
            <input
              id="oferta-fecha-limite"
              type="datetime-local"
              min={ahoraLocal}
              value={form.fecha_limite}
              onChange={(event) => updateField('fecha_limite', event.target.value)}
              aria-invalid={Boolean(errors.fecha_limite)}
            />
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
              value={form.imagen_url}
              onChange={(event) => handleUrlChange(event.target.value)}
              placeholder="https://misitio.com/imagenes/producto.jpg"
            />
          </div>
        )}

        {imageError && <span className="field-error">{imageError}</span>}

        {imagePreview && (
          <div className="oferta-image-preview">
            <img src={imagePreview} alt="Vista previa del producto" onError={() => setImageError('No se pudo cargar la vista previa. Verifica el archivo o la URL.')} />
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
          <button type="button" className="btn btn-outline" onClick={handleReset} disabled={saving}>
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
