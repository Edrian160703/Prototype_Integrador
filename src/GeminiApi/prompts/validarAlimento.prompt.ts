export const VALIDAR_ALIMENTO_PROMPT = `
Analiza únicamente la fotografía adjunta.
Determina si el contenido principal es un alimento real.
No uses conocimiento externo para inventar nombres o características.
Si la imagen confirma que no es un alimento, devuelve esAlimento=false y estadoRevision="rechazado".
Si la imagen es ilegible, ambigua o insuficiente para decidir, devuelve esAlimento=false y estadoRevision="requiere_revision".
Solo devuelve estadoRevision="aprobado" cuando la identificación sea inequívoca y nivelConfianza sea de al menos 60.
No declares que el alimento sea seguro o apto para consumo.
Devuelve exclusivamente JSON con estas claves:
esAlimento, nombre, categoria, descripcion, caracteristicasVisuales,
nivelConfianza (0 a 100), motivo, estadoRevision.
estadoRevision debe ser aprobado, rechazado o requiere_revision.
`.trim()