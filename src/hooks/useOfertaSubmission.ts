import { useState, type FormEvent } from 'react'
import usePublicarOferta from './usePublicarOferta'
import type { OfertaFormValidationContext, OfertaFormValues, FieldErrors } from '../utils/ofertaFormTypes'
import { prepareOfertaSubmission } from '../utils/ofertaFormSubmission'
import type { OfertaPublicationImages } from '../types/oferta'
import { sameCalendarDate } from '../utils/dateOnly'

interface OfertaSubmissionOptions {
  getValues: () => OfertaFormValues
  getValidationContext: () => OfertaFormValidationContext
  getPublicationImages: (expectedDate: string) => OfertaPublicationImages | null
  onPublished: () => void
}

export default function useOfertaSubmission({
  getValues,
  getValidationContext,
  getPublicationImages,
  onPublished,
}: OfertaSubmissionOptions) {
  const { status, statusMessage, saving, clearStatus, showError, publishOferta } = usePublicarOferta()
  const [errors, setErrors] = useState<FieldErrors>({})

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = prepareOfertaSubmission(getValues(), getValidationContext())
    setErrors(result.valid ? {} : result.errors)

    if (!result.valid) {
      showError('Revisa los campos marcados antes de publicar.')
      return
    }

    const images = getPublicationImages(result.expirationDate)
    if (!images || !sameCalendarDate(images.expirationDate, result.expirationDate)) {
      showError('Selecciona y valida las imágenes del alimento y de su vencimiento.')
      return
    }

    await publishOferta(result.payload, images, onPublished)
  }

  return {
    errors,
    status,
    statusMessage,
    saving,
    clearStatus,
    clearErrors: () => setErrors({}),
    clearErrorsFor: (field: keyof OfertaFormValues) => {
      setErrors((current) => ({ ...current, [field]: undefined }))
    },
    handleSubmit,
  }
}
