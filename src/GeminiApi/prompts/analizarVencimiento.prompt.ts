export const ANALIZAR_VENCIMIENTO_PROMPT = `
Analiza únicamente la etiqueta visible en la fotografía adjunta.
Distingue fabricación de vencimiento.
Reconoce VENCE, VENCIMIENTO, CAD, EXP y EXPIRA.
No confunda el número de lote con una fecha.
Si no hay evidencia suficiente o existen varias fechas ambiguas, usa null y requiereRevision=true.
Convierte una fecha inequívoca al formato YYYY-MM-DD y valida que exista en calendario.
Devuelve exclusivamente JSON con estas claves:
nombreProducto, fechaFabricacion, fechaVencimiento, numeroLote,
textoDetectado, legibilidad ("legible", "parcial" o "ilegitible"),
nivelConfianza (0 a 100), requiereRevision, motivoRevision,
estadoRevision ("aprobado", "rechazado" o "requiere_revision"),
vencido.
No determines vencido sin comparar con la fecha real indicada en la etiqueta.
`.trim()