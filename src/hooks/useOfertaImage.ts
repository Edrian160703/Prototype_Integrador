import { useRef, useState, type ChangeEvent } from 'react'
import type { OfertaImageMode } from '../utils/ofertaForm'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

export default function useOfertaImage(onImageChange: (value: string) => void) {
  const [imageMode, setImageMode] = useState<OfertaImageMode>('upload')
  const [imagePreview, setImagePreview] = useState('')
  const [imageError, setImageError] = useState('')
  const [selectedProductFile, setSelectedProductFile] = useState<File | null>(null)
  const [selectedLabelFile, setSelectedLabelFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)

  const clearSelectedFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = ''
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
      setSelectedProductFile(file)
      setImagePreview(dataUrl)
      onImageChange(dataUrl)
    } catch {
      setImageError('No se pudo cargar la imagen. Intenta con otro archivo.')
    }
  }

  const handleUrlChange = (value: string) => {
    onImageChange(value)
    setImagePreview(value.trim())
    setImageError('')
  }

  const switchImageMode = (mode: OfertaImageMode) => {
    setImageMode(mode)
    setImageError('')
    setImagePreview('')
    setSelectedProductFile(null)
    setSelectedLabelFile(null)
    onImageChange('')
    clearSelectedFile()
  }

  const removeImage = () => {
    setImagePreview('')
    setImageError('')
    setSelectedProductFile(null)
    onImageChange('')
    clearSelectedFile()
  }

  const resetImage = () => {
    setImagePreview('')
    setImageError('')
    setSelectedProductFile(null)
    setSelectedLabelFile(null)
    clearSelectedFile()
    if (labelInputRef.current) labelInputRef.current.value = ''
  }

  const handleLabelFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedLabelFile(event.target.files?.[0] ?? null)
  }

  return {
    imageMode,
    imagePreview,
    imageError,
    fileInputRef,
    labelInputRef,
    selectedProductFile,
    selectedLabelFile,
    handleFileChange,
    handleUrlChange,
    handlePreviewError: () => setImageError('No se pudo cargar la vista previa. Verifica el archivo o la URL.'),
    switchImageMode,
    removeImage,
    resetImage,
    handleLabelFileChange,
  }
}
