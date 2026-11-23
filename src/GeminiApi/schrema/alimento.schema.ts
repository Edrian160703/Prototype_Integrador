export const alimentoSchema = {
  type: 'OBJECT',
  required: ['esAlimento', 'nombre', 'categoria', 'descripcion', 'caracteristicasVisuales', 'nivelConfianza', 'motivo', 'estadoRevision'],
  properties: {
    esAlimento: { type: 'BOOLEAN' },
    nombre: { type: 'STRING' },
    categoria: { type: 'STRING' },
    descripcion: { type: 'STRING' },
    caracteristicasVisuales: { type: 'ARRAY', items: { type: 'STRING' } },
    nivelConfianza: { type: 'NUMBER' },
    motivo: { type: 'STRING' },
    estadoRevision: { type: 'STRING', enum: ['aprobado', 'rechazado', 'requiere_revision'] },
  },
} as const