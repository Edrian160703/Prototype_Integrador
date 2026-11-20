import { useState, type FormEvent } from 'react'
import usePublicarOferta from './usePublicarOferta'
import type { OfertaFormValidationContext, OfertaFormValues, FieldErrors } from '../utils/ofertaFormTypes'
import { prepareOfertaSubmission } from '../utils/ofertaFormSubmission'
import { procesarProducto } from '../GeminiApi'

interface OfertaSubmissionOptions {
  getValues: () => OfertaFormValues
  getValidationContext: () => OfertaFormValidationContext
  getSelectedProductFile: () => File | null
  getSelectedLabelFile: () => File | null
  onPublished: () => void
}

export default function useOfertaSubmission({
  getValues,
  getValidationContext,
  getSelectedProductFile,
  getSelectedLabelFile,
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

    const productFile = getSelectedProductFile()
    if (!productFile) {
      showError('Adjunta una fotografía del producto antes de publicar.')
      return
    }
    const labelFile = getSelectedLabelFile()
    if (!labelFile) {
      showError('Adjunta la fotografía de la etiqueta para verificar la fecha de vencimiento.')
      return
    }

    try {
      const analysis = await procesarProducto(productFile, labelFile)
      if (!analysis.puedePublicarse) {
        showError(analysis.mensaje)
        return
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'No pudimos validar las fotografías.')
      return
    }

    await publishOferta(result.payload, onPublished)
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
