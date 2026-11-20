import type { ObjectSchemaRequest } from 'firebase/ai'

export const vencimientoSchema: ObjectSchemaRequest = {
  type: 'object',
  required: ['nombreProducto', 'fechaFabricacion', 'fechaVencimiento', 'numeroLote', 'textoDetectado', 'legibilidad', 'nivelConfianza', 'requiereRevision', 'motivoRevision', 'estadoRevision', 'vencido'],
  properties: {
    nombreProducto: { type: 'string' },
    fechaFabricacion: { type: 'string', nullable: true },
    fechaVencimiento: { type: 'string', nullable: true },
    numeroLote: { type: 'string', nullable: true },
    textoDetectado: { type: 'string' },
    legibilidad: { type: 'string', enum: ['legible', 'parcial', 'ilegitible'] },
    nivelConfianza: { type: 'number' },
    requiereRevision: { type: 'boolean' },
    motivoRevision: { type: 'string' },
    estadoRevision: { type: 'string', enum: ['aprobado', 'rechazado', 'requiere_revision'] },
    vencido: { type: 'boolean' },
  },
}