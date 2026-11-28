import { useState } from 'react'
import useOfertaImage from './useOfertaImage'
import useExpirationEvidenceImage from './useExpirationEvidenceImage'
import useOfertaSchedule from './useOfertaSchedule'
import useOfertaSubmission from './useOfertaSubmission'
import { DESCRIPCION_MAX } from '../utils/ofertaForm'
import { calculateOfertaDiscount } from '../utils/ofertaDiscount'
import type {
  OfertaFormValidationContext,
  OfertaFormValues,
} from '../utils/ofertaFormTypes'
import type { OfertaPublicationImages } from '../types/oferta'

const INITIAL_VALUES: OfertaFormValues = {
  nombre_producto: '',
  id_categoria: '',
  descripcion: '',
  precio_original: '',
  precio_oferta: '',
  cantidad_disponible: '',
  horario_recojo: '',
  fecha_limite: '',
  fecha_vencimiento: '',
  imagen_url: '',
}

export default function usePublicarOfertaForm() {
  const [form, setForm] = useState<OfertaFormValues>(INITIAL_VALUES)

  const {
    horarioInicio,
    horarioFin,
    fechaDia,
    fechaMes,
    fechaAnio,
    fechaHora,
    handleHorarioInicioChange,
    handleHorarioFinChange,
    handleFechaChange,
    resetSchedule,
  } = useOfertaSchedule({
    onHorarioChange: (value) => updateField('horario_recojo', value),
    onFechaChange: (value) => updateField('fecha_limite', value),
  })

  const {
    imageMode,
    imagePreview,
    imageError,
    urlInput,
    scanning: imageScanning,
    selectedImage: foodImage,
    fileInputRef,
    handleFileChange,
    handleUrlChange,
    handlePreviewError,
    switchImageMode,
    removeImage,
    resetImage,
  } = useOfertaImage((value) => updateField('imagen_url', value))
  const expirationEvidence = useExpirationEvidenceImage(form.fecha_vencimiento)

  const getValidationContext = (): OfertaFormValidationContext => {
    const now = new Date()
    const ahoraLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16)

    return {
      horarioInicio,
      horarioFin,
      fechaDia,
      fechaMes,
      fechaAnio,
      fechaHora,
      imageMode,
      ahoraLocal,
    }
  }

  const submission = useOfertaSubmission({
    getValues: () => form,
    getValidationContext,
    getPublicationImages,
    onPublished: resetForm,
  })

  function getPublicationImages(expectedDate: string): OfertaPublicationImages | null {
    if (
      !foodImage ||
      !expirationEvidence.image ||
      !expirationEvidence.isValidated ||
      form.fecha_vencimiento !== expectedDate ||
      !expirationEvidence.recognizedDate
    ) {
      return null
    }

    return {
      food: foodImage,
      expirationEvidence: expirationEvidence.image,
      expirationDate: expirationEvidence.recognizedDate,
    }
  }

  const descripcionRestante = DESCRIPCION_MAX - form.descripcion.length
  const { valid: descuentoValido, percentage: porcentajeDescuento } = calculateOfertaDiscount(
    form.precio_original,
    form.precio_oferta,
  )

  function clearFieldError(field: keyof OfertaFormValues) {
    submission.clearErrorsFor(field)
  }

  function updateField<K extends keyof OfertaFormValues>(
    field: K,
    value: OfertaFormValues[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    clearFieldError(field)
    submission.clearStatus()
  }

  function resetForm() {
    setForm(INITIAL_VALUES)
    resetSchedule()
    resetImage()
    expirationEvidence.removeImage()
    submission.clearErrors()
    submission.clearStatus()
  }

  return {
    form,
    horarioInicio,
    horarioFin,
    fechaDia,
    fechaMes,
    fechaAnio,
    fechaHora,
    errors: submission.errors,
    imageMode,
    imagePreview,
    foodImageSelected: Boolean(foodImage),
    imageError,
    urlInput,
    imageScanning,
    expirationImagePreview: expirationEvidence.preview,
    expirationImageError: expirationEvidence.message,
    expirationImageState: expirationEvidence.state,
    expirationImageAnalyzing: expirationEvidence.isAnalyzing,
    expirationImageValidated: expirationEvidence.isValidated,
    expirationImageInputRef: expirationEvidence.inputRef,
    fileInputRef,
    descripcionRestante,
    descuentoValido,
    porcentajeDescuento,
    status: submission.status,
    statusMessage: submission.statusMessage,
    saving: submission.saving,
    updateField,
    handleHorarioInicioChange,
    handleHorarioFinChange,
    handleFechaChange,
    handleFileChange,
    handleExpirationImageChange: expirationEvidence.handleFileChange,
    handleUrlChange,
    handlePreviewError,
    switchImageMode,
    removeImage,
    removeExpirationImage: expirationEvidence.removeImage,
    resetForm,
    handleSubmit: submission.handleSubmit,
  }
}
