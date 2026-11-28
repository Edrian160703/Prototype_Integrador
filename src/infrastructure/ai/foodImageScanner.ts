import { getFirebaseApp } from '../firebase/firebaseClient'
import { isValidDateOnly } from '../../utils/dateOnly'

export interface FoodScanResult {
  isFood: boolean
  confidence: number
  label: string
  reason: string
}

export type FoodImageScanner = (image: Blob) => Promise<FoodScanResult>

export interface ExpirationDateScanResult {
  isLegible: boolean
  isUnambiguous: boolean
  dateISO: string | null
  confidence: number
}

export type ExpirationDateScanner = (image: Blob) => Promise<ExpirationDateScanResult>

export const FOOD_CONFIDENCE_MIN = 0.6
export const EXPIRATION_DATE_CONFIDENCE_MIN = 0.8
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.8-flash'

const PROMPT = `Eres un moderador de imágenes de una app que vende comida en oferta.
Decide si la imagen muestra un PRODUCTO ALIMENTICIO: comida preparada, frutas, verduras,
panes, postres, bebidas, o alimentos/bebidas empaquetados (bolsas, botellas, latas, cajas de comida).
NO es válido: personas sin comida como protagonista, animales, objetos, ropa, electrónicos,
vehículos, paisajes, capturas de pantalla, documentos, memes, logotipos, imágenes vacías
o contenido inapropiado.
Responde SOLO con JSON: {"is_food": boolean, "confidence": número 0-1,
"label": "qué se ve, en pocas palabras", "reason": "motivo breve en español"}.`

export function parseFoodScanResponse(text: string): FoodScanResult {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const raw = JSON.parse(cleaned) as Record<string, unknown>
  const confidence = Number(raw.confidence)

  return {
    isFood: raw.is_food === true && Number.isFinite(confidence) && confidence >= FOOD_CONFIDENCE_MIN,
    confidence: Number.isFinite(confidence) ? confidence : 0,
    label: typeof raw.label === 'string' ? raw.label : '',
    reason: typeof raw.reason === 'string' ? raw.reason : '',
  }
}

export function parseExpirationDateResponse(text: string): ExpirationDateScanResult {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const raw = JSON.parse(cleaned) as Record<string, unknown>
  const confidence = Number(raw.confidence)
  const dateValue = typeof raw.date_iso === 'string' ? raw.date_iso : ''

  return {
    isLegible: raw.is_legible === true
      && Number.isFinite(confidence)
      && confidence >= EXPIRATION_DATE_CONFIDENCE_MIN,
    isUnambiguous: raw.is_unambiguous === true,
    dateISO: isValidDateOnly(dateValue) ? dateValue : null,
    confidence: Number.isFinite(confidence) ? confidence : 0,
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(blob)
  })
}

export const scanFoodImage: FoodImageScanner = async (image) => {
  // Import dinámico: el SDK de IA solo se descarga cuando se sube una imagen.
  const { getAI, getGenerativeModel, GoogleAIBackend, Schema } = await import('firebase/ai')

  const model = getGenerativeModel(getAI(getFirebaseApp(), { backend: new GoogleAIBackend() }), {
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: Schema.object({
        properties: {
          is_food: Schema.boolean(),
          confidence: Schema.number(),
          label: Schema.string(),
          reason: Schema.string(),
        },
      }),
    },
  })

  const small = await downscaleImage(image)
  const data = await blobToBase64(small)
  const request = [PROMPT, { inlineData: { data, mimeType: small.type } }]

  for (let attempt = 0; ; attempt += 1) {
    try {
      const result = await model.generateContent(request)
      return parseFoodScanResponse(result.response.text())
    } catch (error) {
      if (!isTransientAiError(error) || attempt >= RETRY_DELAYS_MS.length) throw error
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }
}

const EXPIRATION_DATE_PROMPT = `Analiza la etiqueta de vencimiento de un alimento.
Lee únicamente una fecha de vencimiento que sea claramente visible en la imagen.
No infieras ni inventes una fecha. Si hay varias fechas y no puedes distinguir cuál es
la de vencimiento, si es ilegible o si el formato admite varias interpretaciones,
marca is_unambiguous como false y date_iso como una cadena vacía.
Normaliza una fecha inequívoca al formato YYYY-MM-DD. Responde únicamente con JSON:
{"is_legible": boolean, "is_unambiguous": boolean, "date_iso": "YYYY-MM-DD" o "",
"confidence": número entre 0 y 1}.`

export const scanExpirationDate: ExpirationDateScanner = async (image) => {
  const { getAI, getGenerativeModel, GoogleAIBackend, Schema } = await import('firebase/ai')
  const model = getGenerativeModel(getAI(getFirebaseApp(), { backend: new GoogleAIBackend() }), {
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: Schema.object({
        properties: {
          is_legible: Schema.boolean(),
          is_unambiguous: Schema.boolean(),
          date_iso: Schema.string(),
          confidence: Schema.number(),
        },
      }),
    },
  })

  const small = await downscaleImage(image)
  const data = await blobToBase64(small)
  const request = [EXPIRATION_DATE_PROMPT, { inlineData: { data, mimeType: small.type } }]

  for (let attempt = 0; ; attempt += 1) {
    try {
      const result = await model.generateContent(request)
      return parseExpirationDateResponse(result.response.text())
    } catch (error) {
      if (!isTransientAiError(error) || attempt >= RETRY_DELAYS_MS.length) throw error
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }
}

const RETRY_DELAYS_MS = [1500, 3500]

/** Errores temporales de Gemini: saturación (500/503/504) o límite de uso (429). */
export function isTransientAiError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /\[(429|500|502|503|504)\s*\]|high demand|overloaded|quota/i.test(message)
}

/** Reduce la imagen (solo para el análisis) para que se envíe y procese más rápido. */
async function downscaleImage(image: Blob, maxSide = 1024): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(image)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const resized = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return resized ?? image
  } catch {
    return image
  }
}

export function rejectionMessage(result: FoodScanResult): string {
  void result
  return 'La imagen principal debe mostrar claramente un alimento.'
}
