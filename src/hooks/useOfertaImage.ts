import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import type { OfertaImageMode } from '../utils/ofertaForm'
import {
  isTransientAiError,
  rejectionMessage,
  scanFoodImage,
  type FoodImageScanner,
} from '../infrastructure/ai/foodImageScanner'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const URL_SCAN_DELAY_MS = 600

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

async function fetchImageBlob(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('fetch-failed')
  const blob = await response.blob()
  if (!ALLOWED_TYPES.includes(blob.type)) throw new Error('invalid-type')
  if (blob.size > 5 * 1024 * 1024) throw new Error('too-large')
  return blob
}

export default function useOfertaImage(
  onImageChange: (value: string) => void,
  scanner: FoodImageScanner = scanFoodImage,
) {
  const [imageMode, setImageMode] = useState<OfertaImageMode>('upload')
  const [imagePreview, setImagePreview] = useState('')
  const [imageError, setImageError] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const requestId = useRef(0)
  const urlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(urlTimer.current), [])

  const clearSelectedFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Invalida cualquier escaneo en curso y cancela el temporizador de la URL.
  const cancelPending = () => {
    requestId.current += 1
    clearTimeout(urlTimer.current)
    setScanning(false)
  }

  const rejectImage = (message: string) => {
    setImagePreview('')
    onImageChange('')
    setImageError(message)
  }

  /** Escanea con IA. Devuelve true solo si la imagen es un producto alimenticio. */
  const verifyFood = async (blob: Blob, id: number): Promise<boolean> => {
    setScanning(true)
    try {
      const result = await scanner(blob)
      if (id !== requestId.current) return false
      if (!result.isFood) {
        rejectImage(rejectionMessage(result))
        return false
      }
      return true
    } catch (error) {
      console.error('[Escaneo de imagen] Falló la verificación con IA:', error)
      if (id !== requestId.current) return false
      // Si la IA no responde, no se acepta la imagen (no se deja pasar nada sin verificar).
      rejectImage(
        isTransientAiError(error)
          ? 'El servicio de IA está saturado en este momento. Espera unos segundos e intenta de nuevo.'
          : 'No pudimos verificar la imagen en este momento. Intenta de nuevo.',
      )
      return false
    } finally {
      if (id === requestId.current) setScanning(false)
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    cancelPending()
    const id = requestId.current
    setImageError('')
    setImagePreview('')
    onImageChange('')

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Selecciona un archivo de imagen válido (JPG, PNG o WEBP).')
      clearSelectedFile()
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('La imagen no debe superar los 5 MB.')
      clearSelectedFile()
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      if (!(await verifyFood(file, id))) {
        if (id === requestId.current) clearSelectedFile()
        return
      }
      setImagePreview(dataUrl)
      onImageChange(dataUrl)
    } catch {
      setImageError('No se pudo cargar la imagen. Intenta con otro archivo.')
    }
  }

  const scanUrl = async (url: string, id: number) => {
    setScanning(true)
    let blob: Blob
    try {
      blob = await fetchImageBlob(url)
    } catch {
      if (id !== requestId.current) return
      setScanning(false)
      rejectImage('No se pudo analizar esa URL. Usa "Subir imagen" con el archivo de tu producto.')
      return
    }
    if (id !== requestId.current) return
    if (await verifyFood(blob, id)) {
      setImagePreview(url)
      onImageChange(url)
    }
  }

  const handleUrlChange = (value: string) => {
    cancelPending()
    const id = requestId.current
    setUrlInput(value)
    setImageError('')
    setImagePreview('')
    onImageChange('')

    const trimmed = value.trim()
    if (!trimmed) return
    if (!/^https?:\/\//i.test(trimmed)) {
      setImageError('La URL debe empezar con http:// o https://')
      return
    }

    urlTimer.current = setTimeout(() => void scanUrl(trimmed, id), URL_SCAN_DELAY_MS)
  }

  const switchImageMode = (mode: OfertaImageMode) => {
    cancelPending()
    setImageMode(mode)
    setImageError('')
    setImagePreview('')
    setUrlInput('')
    onImageChange('')
    clearSelectedFile()
  }

  const removeImage = () => {
    cancelPending()
    setImagePreview('')
    setImageError('')
    setUrlInput('')
    onImageChange('')
    clearSelectedFile()
  }

  const resetImage = () => {
    cancelPending()
    setImagePreview('')
    setImageError('')
    setUrlInput('')
    clearSelectedFile()
  }

  return {
    imageMode,
    imagePreview,
    imageError,
    urlInput,
    scanning,
    fileInputRef,
    handleFileChange,
    handleUrlChange,
    handlePreviewError: () => setImageError('No se pudo cargar la vista previa. Verifica el archivo o la URL.'),
    switchImageMode,
    removeImage,
    resetImage,
  }
}
