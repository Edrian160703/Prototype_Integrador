import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  scanExpirationDate,
  type ExpirationDateScanner,
} from '../infrastructure/ai/foodImageScanner'
import { isValidDateOnly, sameCalendarDate } from '../utils/dateOnly'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

type ValidationState = 'idle' | 'analyzing' | 'valid' | 'invalid' | 'error'

interface AnalysisResult {
  image: Blob
  expectedDate: string
  state: Exclude<ValidationState, 'idle' | 'analyzing'>
  message: string
  recognizedDate: string | null
}

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

export default function useExpirationEvidenceImage(
  expectedDate: string,
  scanner: ExpirationDateScanner = scanExpirationDate,
) {
  const [image, setImage] = useState<Blob | null>(null)
  const [preview, setPreview] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [selectionError, setSelectionError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const analysisId = useRef(0)
  const previewId = useRef(0)

  useEffect(() => {
    const id = ++analysisId.current

    if (!image) {
      return () => {
        analysisId.current += 1
      }
    }

    if (!isValidDateOnly(expectedDate)) {
      return () => {
        analysisId.current += 1
      }
    }

    void scanner(image).then((result) => {
      if (id !== analysisId.current) return

      if (!result.isLegible || !result.isUnambiguous || !result.dateISO) {
        setAnalysis({
          image,
          expectedDate,
          state: 'invalid',
          message: 'No se pudo identificar una fecha de vencimiento legible y verificable.',
          recognizedDate: null,
        })
        return
      }

      if (!sameCalendarDate(result.dateISO, expectedDate)) {
        setAnalysis({
          image,
          expectedDate,
          state: 'invalid',
          message: 'La fecha de vencimiento no es la misma',
          recognizedDate: result.dateISO,
        })
        return
      }

      setAnalysis({
        image,
        expectedDate,
        state: 'valid',
        message: '',
        recognizedDate: result.dateISO,
      })
    }).catch((error: unknown) => {
      console.error('[Validación de vencimiento] Falló el análisis con IA:', error)
      if (id !== analysisId.current) return
      setAnalysis({
        image,
        expectedDate,
        state: 'error',
        message: 'No se pudo verificar la fecha de vencimiento. Intenta de nuevo.',
        recognizedDate: null,
      })
    })

    return () => {
      analysisId.current += 1
    }
  }, [expectedDate, image, scanner])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const id = ++previewId.current
    setImage(null)
    setPreview('')
    setSelectionError('')

    if (!ALLOWED_TYPES.includes(file.type)) {
      setSelectionError('Selecciona una imagen JPG, PNG o WEBP.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setSelectionError('La fotografía no debe superar los 5 MB.')
      event.target.value = ''
      return
    }

    setImage(file)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      if (id === previewId.current) setPreview(dataUrl)
    } catch (error) {
      if (id !== previewId.current) return
      console.error('[Vista previa de vencimiento] No se pudo leer la fotografía:', error)
      setImage(null)
      setSelectionError('No se pudo cargar la fotografía. Intenta con otra imagen.')
    }
  }

  const removeImage = () => {
    previewId.current += 1
    setImage(null)
    setPreview('')
    setSelectionError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const currentAnalysis = analysis?.image === image && analysis.expectedDate === expectedDate
    ? analysis
    : null
  const state: ValidationState = selectionError
    ? 'error'
    : !image || !isValidDateOnly(expectedDate)
      ? 'idle'
      : currentAnalysis?.state ?? 'analyzing'
  const message = selectionError || currentAnalysis?.message || ''
  const isValidated = currentAnalysis?.state === 'valid'

  return {
    image,
    preview,
    state,
    message,
    isAnalyzing: state === 'analyzing',
    isValidated,
    recognizedDate: isValidated ? currentAnalysis?.recognizedDate ?? null : null,
    inputRef,
    handleFileChange,
    removeImage,
  }
}
