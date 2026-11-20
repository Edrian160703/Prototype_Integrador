export const VALIDAR_ALIMENTO_PROMPT = `
Analiza únicamente la fotografía adjunta.
Determina si el contenido principal es un alimento real.
No uses conocimiento externo para inventar nombres o características.
Si no puedes identificarlo con confianza, devuelve esAlimento=false y estadoRevision="requiere_revision".
No declares que el alimento sea seguro o apto para consumo.
Devuelve exclusivamente JSON con estas claves:
esAlimento, nombre, categoria, descripcion, caracteristicasVisuales,
nivelConfianza (0 a 100), motivo, estadoRevision.
estadoRevision debe ser aprobado, rechazado o requiere_revision.
`.trim()