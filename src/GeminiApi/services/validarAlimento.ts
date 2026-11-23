import type { ResultadoAlimento } from '../types/alimento.types'
import type { GeminiJsonClient } from './geminiClient'

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
  const confidenceInsufficient = value.nivelConfianza < 60
  const confirmedNonFood = !value.esAlimento
    && estadoRevision === 'rechazado'
    && !confidenceInsufficient
  if (confirmedNonFood) {
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
  if (
    !value.esAlimento && estadoRevision === 'aprobado'
    || value.esAlimento && estadoRevision === 'rechazado'
    || !value.esAlimento && estadoRevision === 'rechazado' && confidenceInsufficient
    || confidenceInsufficient
    || estadoRevision === 'requiere_revision'
  ) {
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

  if (estadoRevision === 'rechazado') {
    return {
      esAlimento: value.esAlimento,
      nombre: value.nombre,
      categoria: value.categoria,
      descripcion: value.descripcion,
      caracteristicasVisuales: value.caracteristicasVisuales,
      nivelConfianza: value.nivelConfianza,
      motivo: value.motivo,
      estadoRevision: 'rechazado',
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
    estadoRevision: 'aprobado',
  }
}

export function createValidarAlimento(geminiClient: GeminiJsonClient) {
  return async function validarAlimento(image: { mimeType: string; data: string }): Promise<ResultadoAlimento> {
    const value = await geminiClient.generateJson('validateFood', image)
    return parseResultadoAlimento(value)
  }
}