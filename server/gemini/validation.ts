import sharp from 'sharp'
import { HttpError } from './errors'
import type { JsonRecord } from './types'

const MAX_IMAGE_BYTES = 3 * 1024 * 1024
const MAX_IMAGE_PIXELS = 40_000_000
const PNG_IEND_CHUNK = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82])
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MIME_TYPES_BY_FORMAT: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

function matchesDeclaredImageType(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3
      && bytes[0] === 0xff
      && bytes[1] === 0xd8
      && bytes[2] === 0xff
  }
  if (mimeType === 'image/png') {
    return bytes.length >= 8
      && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }
  return bytes.length >= 12
    && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
}

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseJsonObject(text: string): JsonRecord {
  try {
    const value: unknown = JSON.parse(text)
    if (isRecord(value)) return value
  } catch {
    throw new HttpError(400, 'INVALID_REQUEST', 'El cuerpo debe contener JSON válido.')
  }
  throw new HttpError(400, 'INVALID_REQUEST', 'El cuerpo debe ser un objeto JSON.')
}

export function readImage(value: unknown): { mimeType: string; data: string } {
  if (!isRecord(value) || typeof value.mimeType !== 'string' || typeof value.data !== 'string') {
    throw new HttpError(400, 'INVALID_IMAGE', 'Adjunta una imagen válida.')
  }

  const { mimeType, data } = value
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new HttpError(400, 'INVALID_IMAGE', 'El formato permitido es JPG, PNG o WEBP.')
  }
  if (!data || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) {
    throw new HttpError(400, 'INVALID_IMAGE', 'La imagen está vacía o tiene un formato inválido.')
  }
  if (data.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) {
    throw new HttpError(413, 'IMAGE_TOO_LARGE', 'La imagen supera el tamaño permitido de 3 MB.')
  }

  const bytes = Buffer.from(data, 'base64')
  if (!bytes.length || bytes.toString('base64') !== data) {
    throw new HttpError(400, 'INVALID_IMAGE', 'La imagen está vacía o tiene un formato inválido.')
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new HttpError(413, 'IMAGE_TOO_LARGE', 'La imagen supera el tamaño permitido de 3 MB.')
  }
  if (!matchesDeclaredImageType(bytes, mimeType)) {
    throw new HttpError(400, 'INVALID_IMAGE', 'El contenido no corresponde al formato de imagen declarado.')
  }

  return { mimeType, data }
}

export async function assertDecodableImage(image: { mimeType: string; data: string }): Promise<void> {
  const bytes = Buffer.from(image.data, 'base64')

  try {
    if (
      image.mimeType === 'image/png'
      && !bytes.subarray(-PNG_IEND_CHUNK.length).equals(PNG_IEND_CHUNK)
    ) {
      throw new HttpError(400, 'INVALID_IMAGE', 'La imagen está dañada o no se puede decodificar.')
    }

    const decoder = sharp(bytes, {
      failOn: 'warning',
      limitInputPixels: MAX_IMAGE_PIXELS,
    })
    const metadata = await decoder.metadata()
    if (MIME_TYPES_BY_FORMAT[metadata.format ?? ''] !== image.mimeType) {
      throw new HttpError(400, 'INVALID_IMAGE', 'El contenido no corresponde al formato de imagen declarado.')
    }
    await decoder.toBuffer()
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'INVALID_IMAGE', 'La imagen está dañada o no se puede decodificar.')
  }
}

export function assertAllowedKeys(body: JsonRecord, allowedKeys: readonly string[]): void {
  if (Object.keys(body).some((key) => !allowedKeys.includes(key))) {
    throw new HttpError(400, 'INVALID_REQUEST', 'La solicitud contiene campos no permitidos.')
  }
}

function isValidConfidence(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 100
}

export function isValidFoodResult(value: unknown): value is JsonRecord {
  return isRecord(value)
    && typeof value.esAlimento === 'boolean'
    && typeof value.nombre === 'string'
    && typeof value.categoria === 'string'
    && typeof value.descripcion === 'string'
    && Array.isArray(value.caracteristicasVisuales)
    && value.caracteristicasVisuales.every((item) => typeof item === 'string')
    && isValidConfidence(value.nivelConfianza)
    && typeof value.motivo === 'string'
    && ['aprobado', 'rechazado', 'requiere_revision'].includes(String(value.estadoRevision))
}

export function isValidExpirationResult(value: unknown): value is JsonRecord {
  return isRecord(value)
    && typeof value.nombreProducto === 'string'
    && (value.fechaFabricacion === null || typeof value.fechaFabricacion === 'string')
    && (value.fechaVencimiento === null || typeof value.fechaVencimiento === 'string')
    && (value.numeroLote === null || typeof value.numeroLote === 'string')
    && typeof value.textoDetectado === 'string'
    && ['legible', 'parcial', 'ilegitible'].includes(String(value.legibilidad))
    && isValidConfidence(value.nivelConfianza)
    && typeof value.requiereRevision === 'boolean'
    && typeof value.motivoRevision === 'string'
    && ['aprobado', 'rechazado', 'requiere_revision'].includes(String(value.estadoRevision))
    && typeof value.vencido === 'boolean'
}

export function parseProviderJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(502, 'INVALID_PROVIDER_RESPONSE', 'Gemini devolvió JSON inválido.')
  }
}
