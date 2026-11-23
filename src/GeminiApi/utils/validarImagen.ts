export const MAX_IMAGE_SIZE = 3 * 1024 * 1024

export type ImageValidationResult =
  | { valid: true }
  | { valid: false; message: string }

export function validateImage(file: File): ImageValidationResult {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { valid: false, message: 'Selecciona una imagen JPG, PNG o WEBP.' }
  }
  if (file.size <= 0) {
    return { valid: false, message: 'La imagen está vacía.' }
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, message: 'La imagen no debe superar los 3 MB.' }
  }
  return { valid: true }
}