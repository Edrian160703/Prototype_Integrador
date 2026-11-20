import { VALIDAR_ALIMENTO_PROMPT } from '../prompts/validarAlimento.prompt'
import { alimentoSchema } from '../schrema/alimento.schema'
import type { ResultadoAlimento } from '../types/alimento.types'
import { generateJson } from './geminiClient'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseResultadoAlimento(value: unknown): ResultadoAlimento {
  if (!isObject(value)) throw new Error('La respuesta de alimento no tiene un formato válido.')
  if (
    typeof value.esAlimento !== 'boolean'
    || typeof value.nombre !== 'string'
    || typeof value.categoria !== 'string'
    || typeof value.descripcion !== 'string'
    || !Array.isArray(value.caracteristicasVisuales)
    || !value.caracteristicasVisuales.every((item) => typeof item === 'string')
    || typeof value.nivelConfianza !== 'number'
    || value.nivelConfianza < 0
    || value.nivelConfianza > 100
    || typeof value.motivo !== 'string'
    || !['aprobado', 'rechazado', 'requiere_revision'].includes(String(value.estadoRevision))
  ) {
    throw new Error('La respuesta de alimento no pasó la validación estructural.')
  }

  const estadoRevision = value.estadoRevision as ResultadoAlimento['estadoRevision']
  if (!value.esAlimento || estadoRevision === 'rechazado') {
    return {
      esAlimento: false,
      nombre: '',
      categoria: '',
      descripcion: '',
      caracteristicasVisuales: [],
      nivelConfianza: value.nivelConfianza,
      motivo: value.motivo,
      estadoRevision: 'rechazado',
    }
  }
  if (value.nivelConfianza < 60) {
    return {
      esAlimento: value.esAlimento,
      nombre: value.nombre,
      categoria: value.categoria,
      descripcion: value.descripcion,
      caracteristicasVisuales: value.caracteristicasVisuales,
      nivelConfianza: value.nivelConfianza,
      motivo: 'La imagen no permite una identificación suficientemente confiable.',
      estadoRevision: 'requiere_revision',
    }
  }
  return {
    esAlimento: value.esAlimento,
    nombre: value.nombre,
    categoria: value.categoria,
    descripcion: value.descripcion,
    caracteristicasVisuales: value.caracteristicasVisuales,
    nivelConfianza: value.nivelConfianza,
    motivo: value.motivo,
    estadoRevision,
  }
}

export async function validarAlimento(image: { mimeType: string; data: string }): Promise<ResultadoAlimento> {
  const value = await generateJson(VALIDAR_ALIMENTO_PROMPT, image, alimentoSchema)
  return parseResultadoAlimento(value)
}