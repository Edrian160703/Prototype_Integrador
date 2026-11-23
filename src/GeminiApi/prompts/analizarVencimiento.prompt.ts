export const ANALIZAR_VENCIMIENTO_PROMPT = `
Analiza únicamente la etiqueta visible en la fotografía adjunta.
Distingue fabricación de vencimiento.
Reconoce VENCE, VENCIMIENTO, CAD, EXP y EXPIRA.
No confunda el número de lote con una fecha.
Si no hay evidencia suficiente o existen varias fechas ambiguas, usa null y requiereRevision=true.
Convierte una fecha inequívoca al formato YYYY-MM-DD y valida que exista en calendario.
Si una fecha está incompleta o no existe en el calendario, usa null y requiereRevision=true.
Conserva el texto visible sin corregirlo y distingue explícitamente fabricación, lote y vencimiento.
Solo interpreta una fecha como vencimiento cuando una etiqueta inequívoca la asocia con vencimiento.
Si la fecha de fabricación es igual o posterior al vencimiento, requiere revisión manual.
Devuelve exclusivamente JSON con estas claves:
nombreProducto, fechaFabricacion, fechaVencimiento, numeroLote,
textoDetectado, legibilidad ("legible", "parcial" o "ilegitible"),
nivelConfianza (0 a 100), requiereRevision, motivoRevision,
estadoRevision ("aprobado", "rechazado" o "requiere_revision"),
vencido.
Compara la fecha de vencimiento con el día actual en America/Lima; el producto sigue vigente durante el día impreso.
`.trim()