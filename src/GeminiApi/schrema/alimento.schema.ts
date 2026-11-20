import type { ObjectSchemaRequest } from 'firebase/ai'

export const alimentoSchema: ObjectSchemaRequest = {
  type: 'object',
  required: ['esAlimento', 'nombre', 'categoria', 'descripcion', 'caracteristicasVisuales', 'nivelConfianza', 'motivo', 'estadoRevision'],
  properties: {
    esAlimento: { type: 'boolean' },
    nombre: { type: 'string' },
    categoria: { type: 'string' },
    descripcion: { type: 'string' },
    caracteristicasVisuales: { type: 'array', items: { type: 'string' } },
    nivelConfianza: { type: 'number' },
    motivo: { type: 'string' },
    estadoRevision: { type: 'string', enum: ['aprobado', 'rechazado', 'requiere_revision'] },
  },
}