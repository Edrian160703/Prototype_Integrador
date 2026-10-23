import { useState, type FormEvent } from 'react'
import usePublicarOferta from './usePublicarOferta'
import type { OfertaFormValidationContext, OfertaFormValues, FieldErrors } from '../utils/ofertaFormTypes'
import { prepareOfertaSubmission } from '../utils/ofertaFormSubmission'

interface OfertaSubmissionOptions {
  getValues: () => OfertaFormValues
  getValidationContext: () => OfertaFormValidationContext
  onPublished: () => void
}

export default function useOfertaSubmission({
  getValues,
  getValidationContext,
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
