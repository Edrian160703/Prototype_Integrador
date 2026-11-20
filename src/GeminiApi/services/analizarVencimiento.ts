import { ANALIZAR_VENCIMIENTO_PROMPT } from '../prompts/analizarVencimiento.prompt'
import { vencimientoSchema } from '../schrema/vencimiento.schema'
import type { ResultadoVencimiento } from '../types/vencimiento.types'
import { isExpiredIsoDate, isValidIsoDate } from '../utils/validarFecha'
import { generateJson } from './geminiClient'

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseResultadoVencimiento(value: unknown, now = new Date()): ResultadoVencimiento {
  if (!isObject(value)) throw new Error('La respuesta de vencimiento no tiene un formato válido.')
  const nombreProducto = nullableString(value.nombreProducto) ?? ''
  const fechaFabricacion = nullableString(value.fechaFabricacion)
  const fechaVencimiento = nullableString(value.fechaVencimiento)
  const numeroLote = nullableString(value.numeroLote)
  const textoDetectado = typeof value.textoDetectado === 'string' ? value.textoDetectado : ''
  const legibilidad = value.legibilidad
  const nivelConfianza = value.nivelConfianza
  const requiereRevision = value.requiereRevision
  const motivoRevision = typeof value.motivoRevision === 'string' ? value.motivoRevision : ''

  if (
    typeof nombreProducto !== 'string'
    || (fechaFabricacion !== null && !isValidIsoDate(fechaFabricacion))
    || (fechaVencimiento !== null && !isValidIsoDate(fechaVencimiento))
    || !['legible', 'parcial', 'ilegitible'].includes(String(legibilidad))
    || typeof nivelConfianza !== 'number'
    || nivelConfianza < 0
    || nivelConfianza > 100
    || typeof requiereRevision !== 'boolean'
  ) {
    throw new Error('La respuesta de vencimiento no pasó la validación estructural.')
  }

  const requiereRevisionFinal = requiereRevision
    || !fechaVencimiento
    || legibilidad !== 'legible'
    || nivelConfianza < 60
  const vencido = fechaVencimiento ? isExpiredIsoDate(fechaVencimiento, now) : false

  return {
    nombreProducto,
    fechaFabricacion,
    fechaVencimiento,
    numeroLote,
    textoDetectado,
    legibilidad: legibilidad as ResultadoVencimiento['legibilidad'],
    nivelConfianza,
    requiereRevision: requiereRevisionFinal,
    motivoRevision: requiereRevisionFinal
      ? (motivoRevision || 'La fecha debe ser revisada y confirmada por el comerciante.')
      : '',
    estadoRevision: vencido ? 'rechazado' : (requiereRevisionFinal ? 'requiere_revision' : 'aprobado'),
    vencido,
  }
}

export async function analizarVencimiento(image: { mimeType: string; data: string }): Promise<ResultadoVencimiento> {
  const value = await generateJson(ANALIZAR_VENCIMIENTO_PROMPT, image, vencimientoSchema)
  return parseResultadoVencimiento(value)
}