# Prototype_Integrador

## Seguridad de reservas e inventario en Spark

Las operaciones nuevas de reservas y stock usan transacciones del SDK cliente y un ledger inmutable en `inventario_movimientos`. Las reglas locales solo aceptan un cambio de stock cuando el ledger, la reserva, la oferta y el producto describen el mismo movimiento y quedan escritos en una transacción. El claim autenticado `admin` se valida en las reglas; el cliente no puede asignarse ese claim.

Ofertas y productos se archivan con estado/campo de archivo en vez de borrarse, para preservar referencias históricas. Las reservas se conservan; cancelar o eliminar desde el panel cambia el estado y registra una sola devolución. Las reservas heredadas sin movimiento verificable y los productos/ofertas sin `inventory_version: 1` y vínculo explícito se bloquean para compras, ajustes y devoluciones automáticas; la aplicación muestra un error y no escribe parcialmente.

No se ejecutó backfill ni se modificaron documentos remotos. Para regularizar datos heredados, primero debe prepararse un inventario administrativo de productos, ofertas, reservas activas y saldos; revisar manualmente que cada relación sea única y que los stocks coincidan; luego autorizar un proceso controlado de inicialización que escriba el vínculo `inventory_offer_id`, `inventory_version` y un asiento de apertura. Hasta entonces, esos registros permanecen intactos y bloqueados para movimientos.

El proyecto no utiliza Cloud Functions: las operaciones de reservas e inventario se ejecutan con transacciones de Firestore desde el cliente, limitadas por las reglas. El backend callable antiguo se retiró.

Para validación local:

- Frontend: `npm test` y `npm run build`.
- Reglas y transacciones con Firestore Emulator: `npm run test:rules` (requiere Java; las herramientas de emulación y Rules Unit Testing están aisladas en `firestore-tests/`).

`firebase.json` y `firestore.rules` son configuración propuesta en este checkout. No se incluye `.firebaserc` ni se verificaron el proyecto Firebase, sus datos o las reglas desplegadas. No desplegar ni activar facturación sin revisar esas diferencias. No se realizó despliegue ni migración como parte de esta etapa.

La configuración `VITE_FIREBASE_*` del archivo `.env` local conecta el frontend al proyecto Firebase indicado por sus valores; no activa el emulador. Para desarrollo local, puedes copiar `.env.example` a `.env.local` y completar la configuración de la aplicación web Firebase. En Vercel, define las mismas variables para cada entorno (Production, Preview y Development) y vuelve a desplegar. El archivo `.env` local no se versiona. El emulador se inicia únicamente al ejecutar `npm run test:rules`. No añadas claves privadas ni secretos a variables `VITE_*`, porque Vite las expone en el cliente.