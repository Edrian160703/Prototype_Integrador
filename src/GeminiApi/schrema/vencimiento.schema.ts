export const vencimientoSchema = {
  type: 'OBJECT',
  required: ['nombreProducto', 'fechaFabricacion', 'fechaVencimiento', 'numeroLote', 'textoDetectado', 'legibilidad', 'nivelConfianza', 'requiereRevision', 'motivoRevision', 'estadoRevision', 'vencido'],
  properties: {
    nombreProducto: { type: 'STRING' },
    fechaFabricacion: { type: 'STRING', nullable: true },
    fechaVencimiento: { type: 'STRING', nullable: true },
    numeroLote: { type: 'STRING', nullable: true },
    textoDetectado: { type: 'STRING' },
    legibilidad: { type: 'STRING', enum: ['legible', 'parcial', 'ilegitible'] },
    nivelConfianza: { type: 'NUMBER' },
    requiereRevision: { type: 'BOOLEAN' },
    motivoRevision: { type: 'STRING' },
    estadoRevision: { type: 'STRING', enum: ['aprobado', 'rechazado', 'requiere_revision'] },
    vencido: { type: 'BOOLEAN' },
  },
} as const