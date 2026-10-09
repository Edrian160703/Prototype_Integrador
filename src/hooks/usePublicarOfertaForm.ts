import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import usePublicarOferta from './usePublicarOferta'
import type { OfertaPayload } from '../types/oferta'
import {
  combinarFechaHora,
  combinarHorario,
  DESCRIPCION_MAX,
  isValidDecimal,
  normalizeDecimalOnBlur,
  validateOfertaForm,
} from '../utils/ofertaForm'
import type { FieldErrors, OfertaFormValues, OfertaImageMode } from '../utils/ofertaForm'

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

type FechaPart = 'dia' | 'mes' | 'anio' | 'hora'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

export default function usePublicarOfertaForm() {
  const { status, statusMessage, saving, clearStatus, showError, publishOferta } = usePublicarOferta()
  const [form, setForm] = useState<OfertaFormValues>(INITIAL_VALUES)
  const [horarioInicio, setHorarioInicio] = useState('')
  const [horarioFin, setHorarioFin] = useState('')
  const [fechaDia, setFechaDia] = useState('')
  const [fechaMes, setFechaMes] = useState('')
  const [fechaAnio, setFechaAnio] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [imageMode, setImageMode] = useState<OfertaImageMode>('upload')
  const [imagePreview, setImagePreview] = useState('')
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const descripcionRestante = DESCRIPCION_MAX - form.descripcion.length
  const ahoraLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  const descuentoValido = isValidDecimal(form.precio_original)
    && isValidDecimal(form.precio_oferta)
    && Number(form.precio_oferta) < Number(form.precio_original)
  const porcentajeDescuento = descuentoValido
    ? Math.round((1 - Number(form.precio_oferta) / Number(form.precio_original)) * 100)
    : 0

  const updateField = <K extends keyof OfertaFormValues>(field: K, value: OfertaFormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    clearStatus()
  }

  const handleHorarioInicioChange = (value: string) => {
    setHorarioInicio(value)
    updateField('horario_recojo', combinarHorario(value, horarioFin))
  }

  const handleHorarioFinChange = (value: string) => {
    setHorarioFin(value)
    updateField('horario_recojo', combinarHorario(horarioInicio, value))
  }

  const handleFechaChange = (part: FechaPart, value: string) => {
    const next = {
      dia: part === 'dia' ? value : fechaDia,
      mes: part === 'mes' ? value : fechaMes,
      anio: part === 'anio' ? value : fechaAnio,
      hora: part === 'hora' ? value : fechaHora,
    }
    if (part === 'dia') setFechaDia(value)
    if (part === 'mes') setFechaMes(value)
    if (part === 'anio') setFechaAnio(value)
    if (part === 'hora') setFechaHora(value)
    updateField('fecha_limite', combinarFechaHora(next.dia, next.mes, next.anio, next.hora))
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

  const clearSelectedFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const switchImageMode = (mode: OfertaImageMode) => {
    setImageMode(mode)
    setImageError('')
    setImagePreview('')
    updateField('imagen_url', '')
    clearSelectedFile()
  }

  const removeImage = () => {
    setImagePreview('')
    setImageError('')
    updateField('imagen_url', '')
    clearSelectedFile()
  }

  const resetForm = () => {
    setForm(INITIAL_VALUES)
    setHorarioInicio('')
    setHorarioFin('')
    setFechaDia('')
    setFechaMes('')
    setFechaAnio('')
    setFechaHora('')
    setImagePreview('')
    setImageError('')
    setErrors({})
    clearStatus()
    clearSelectedFile()
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

    const nextErrors = validateOfertaForm(values, {
      horarioInicio,
      horarioFin,
      fechaDia,
      fechaMes,
      fechaAnio,
      fechaHora,
      imageMode,
      ahoraLocal,
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      showError('Revisa los campos marcados antes de publicar.')
      return
    }

    const payload: OfertaPayload = {
      ...values,
      precio_original: Number(values.precio_original),
      precio_oferta: Number(values.precio_oferta),
      cantidad_disponible: Number(values.cantidad_disponible),
      estado: 'disponible',
    }

    await publishOferta(payload, resetForm)
  }

  return {
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
    handlePreviewError: () => setImageError('No se pudo cargar la vista previa. Verifica el archivo o la URL.'),
    switchImageMode,
    removeImage,
    resetForm,
    handleSubmit,
  }
}
