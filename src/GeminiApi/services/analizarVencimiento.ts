import type { ResultadoVencimiento } from '../types/vencimiento.types'
import {
  compareIsoCalendarDates,
  getBusinessCalendarDate,
  isEvaluationDateCurrent,
  isExpiredIsoDateOnBusinessDate,
  isValidIsoDate,
} from '../utils/validarFecha'
import type { GeminiJsonClient } from './geminiClient'

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

type CalendarDateIssue = 'incomplete' | 'impossible' | null

interface ParsedCalendarDate {
  value: string | null
  issue: CalendarDateIssue
}

function parseCalendarDate(value: unknown): ParsedCalendarDate {
  if (value === null) return { value: null, issue: null }
  if (typeof value !== 'string') throw new Error('La respuesta de vencimiento no pasó la validación estructural.')

  const date = value.trim()
  if (!date) return { value: null, issue: 'incomplete' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { value: null, issue: 'incomplete' }
  if (!isValidIsoDate(date)) return { value: null, issue: 'impossible' }
  return { value: date, issue: null }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

type DetectedDateIssue = 'contradictory' | 'ambiguous' | null

const DATE_TOKEN_PATTERN = /(?:\b\d{4}[-/.]\d{2}[-/.]\d{2}\b|\b\d{1,2}[./-]\d{1,2}[./-]\d{4}\b)/giu
const EXPIRATION_LABEL_PATTERN = /\b(?:vence|vencimiento|caducidad|caduca|cad|expira|expiracion|expiración|exp)\b|f(?:e)?cha\s+de\s+consumo/giu
const MANUFACTURING_LABEL_PATTERN = /\b(?:fab(?:ricacion|ricación)?|fabricado|elaborado|env(?:asado)?|lote)\b/giu

function normalizeDetectedDate(token: string): string | null {
  const compact = token.replace(/[./]/g, '-')
  let parts: string[] | null = null
  if (/^\d{4}-\d{2}-\d{2}$/.test(compact)) {
    const [year, month, day] = compact.split('-')
    parts = [year, month, day]
  } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(compact)) {
    const [day, month, year] = compact.split('-')
    if (!day || !month || !year) return null
    parts = [year, month.padStart(2, '0'), day.padStart(2, '0')]
  }
  if (!parts) return null
  const iso = `${parts[0]}-${parts[1]}-${parts[2]}`
  return isValidIsoDate(iso) ? iso : null
}

function hasAmbiguousSeparatorDate(text: string): boolean {
  return /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2}\b/.test(text)
}

function detectTextDateIssue(text: string, fechaVencimiento: string | null): DetectedDateIssue {
  if (!text.trim() || hasAmbiguousSeparatorDate(text)) return fechaVencimiento ? 'ambiguous' : null

  const expirationLabels = [...text.matchAll(EXPIRATION_LABEL_PATTERN)]
  const dateMatches = [...text.matchAll(DATE_TOKEN_PATTERN)]
  if (dateMatches.length === 0) return null

  const dates = dateMatches
    .map((match) => ({ token: match[0], index: match.index ?? 0, iso: normalizeDetectedDate(match[0]) }))
    .filter((item): item is { token: string; index: number; iso: string } => item.iso !== null)

  if (dates.length === 0) return null

  if (expirationLabels.length > 0) {
    for (const label of expirationLabels) {
      const labelIndex = label.index ?? 0
      const nearby = dates.find((date) =>
        date.index >= labelIndex && date.index - labelIndex <= 40,
      )
      if (nearby && fechaVencimiento && nearby.iso !== fechaVencimiento) {
        return 'contradictory'
      }
    }
  }

  const manufacturingLabels = [...text.matchAll(MANUFACTURING_LABEL_PATTERN)]
  if (manufacturingLabels.length > 0 && expirationLabels.length > 0) {
    for (const label of expirationLabels) {
      const labelIndex = label.index ?? 0
      const expirationDate = dates.find((date) =>
        date.index >= labelIndex && date.index - labelIndex <= 40,
      )
      if (expirationDate && fechaVencimiento && expirationDate.iso !== fechaVencimiento) {
        return 'contradictory'
      }
    }
  }

  if (expirationLabels.length === 0 && dates.length > 1) return 'ambiguous'
  if (expirationLabels.length === 0) return 'ambiguous'
  return null
}

export function parseResultadoVencimiento(value: unknown, now = new Date()): ResultadoVencimiento {
  if (!isObject(value)) throw new Error('La respuesta de vencimiento no tiene un formato válido.')
  const parsedFechaFabricacion = parseCalendarDate(value.fechaFabricacion)
  const parsedFechaVencimiento = parseCalendarDate(value.fechaVencimiento)
  const nombreProducto = nullableString(value.nombreProducto) ?? ''
  const fechaFabricacion = parsedFechaFabricacion.value
  const fechaVencimiento = parsedFechaVencimiento.value
  const numeroLote = nullableString(value.numeroLote)
  const textoDetectado = typeof value.textoDetectado === 'string' ? value.textoDetectado : ''
  const legibilidad = value.legibilidad
  const nivelConfianza = value.nivelConfianza
  const requiereRevision = value.requiereRevision
  const motivoRevision = typeof value.motivoRevision === 'string' ? value.motivoRevision : ''
  const estadoRevision = value.estadoRevision
  const vencidoModelo = value.vencido
  const fechaEvaluacion = value.fechaEvaluacion
  const hasInvalidEvaluationDate = fechaEvaluacion !== undefined && !isValidIsoDate(fechaEvaluacion)
  const fechaEvaluacionFinal = isValidIsoDate(fechaEvaluacion)
    ? fechaEvaluacion
    : getBusinessCalendarDate(now)
  const evaluacionObsoleta = !isEvaluationDateCurrent(fechaEvaluacionFinal, now)

  if (
    typeof value.nombreProducto !== 'string'
    || (value.fechaFabricacion !== null && typeof value.fechaFabricacion !== 'string')
    || (value.fechaVencimiento !== null && typeof value.fechaVencimiento !== 'string')
    || !['legible', 'parcial', 'ilegitible'].includes(String(legibilidad))
    || typeof nivelConfianza !== 'number'
    || nivelConfianza < 0
    || nivelConfianza > 100
    || typeof requiereRevision !== 'boolean'
    || !['aprobado', 'rechazado', 'requiere_revision'].includes(String(estadoRevision))
    || typeof vencidoModelo !== 'boolean'
  ) {
    throw new Error('La respuesta de vencimiento no pasó la validación estructural.')
  }

  const relacionCronologica = fechaFabricacion && fechaVencimiento
    ? compareIsoCalendarDates(fechaFabricacion, fechaVencimiento)
    : null
  const fechasContradictorias = relacionCronologica !== null && relacionCronologica >= 0
  const textoContradictorio = detectTextDateIssue(textoDetectado, fechaVencimiento)
  const vencido = fechaVencimiento
    ? isExpiredIsoDateOnBusinessDate(fechaVencimiento, fechaEvaluacionFinal)
    : false
  const indicadorVencidoIncoherente = vencidoModelo !== vencido
  const requiereRevisionFinal = requiereRevision
    || estadoRevision === 'requiere_revision'
    || !fechaVencimiento
    || legibilidad !== 'legible'
    || nivelConfianza < 60
    || parsedFechaFabricacion.issue !== null
    || parsedFechaVencimiento.issue !== null
    || fechasContradictorias
    || indicadorVencidoIncoherente
    || hasInvalidEvaluationDate
    || evaluacionObsoleta
    || textoContradictorio !== null
  let motivoRevisionFinal = motivoRevision || 'La fecha debe ser revisada y confirmada por el comerciante.'
  if (fechasContradictorias) {
    motivoRevisionFinal = 'Las fechas de fabricación y vencimiento son iguales o la fabricación es posterior.'
  } else if (parsedFechaVencimiento.issue === 'impossible') {
    motivoRevisionFinal = 'La fecha de vencimiento no existe en el calendario.'
  } else if (parsedFechaVencimiento.issue === 'incomplete' || !fechaVencimiento) {
    motivoRevisionFinal = 'No se identificó una fecha de vencimiento completa.'
  } else if (parsedFechaFabricacion.issue === 'impossible') {
    motivoRevisionFinal = 'La fecha de fabricación no existe en el calendario.'
  } else if (parsedFechaFabricacion.issue === 'incomplete') {
    motivoRevisionFinal = 'La fecha de fabricación está incompleta o no tiene el formato esperado.'
  } else if (indicadorVencidoIncoherente) {
    motivoRevisionFinal = `El indicador vencido no coincide con la fecha de evaluación de Lima (${fechaEvaluacionFinal}).`
  } else if (hasInvalidEvaluationDate) {
    motivoRevisionFinal = 'La fecha de evaluación del servidor no es válida.'
  } else if (evaluacionObsoleta) {
    motivoRevisionFinal = 'La evaluación de vencimiento está obsoleta y debe repetirse el análisis.'
  } else if (textoContradictorio === 'contradictory') {
    motivoRevisionFinal = 'El texto detectado contradice la fecha de vencimiento interpretada.'
  } else if (textoContradictorio === 'ambiguous') {
    motivoRevisionFinal = 'El texto detectado contiene fechas ambiguas y requiere revisión manual.'
  }

  return {
    nombreProducto,
    fechaFabricacion,
    fechaVencimiento,
    numeroLote,
    textoDetectado,
    legibilidad: legibilidad as ResultadoVencimiento['legibilidad'],
    nivelConfianza,
    requiereRevision: requiereRevisionFinal,
    motivoRevision: requiereRevisionFinal ? motivoRevisionFinal : '',
    estadoRevision: vencido || estadoRevision === 'rechazado'
      ? 'rechazado'
      : (requiereRevisionFinal ? 'requiere_revision' : 'aprobado'),
    vencido,
    fechaEvaluacion: fechaEvaluacionFinal,
  }
}

export function createAnalizarVencimiento(geminiClient: GeminiJsonClient) {
  return async function analizarVencimiento(image: { mimeType: string; data: string }): Promise<ResultadoVencimiento> {
    const value = await geminiClient.generateJson('analyzeExpiration', image)
    return parseResultadoVencimiento(value)
  }
}