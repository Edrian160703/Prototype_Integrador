# Gemini Developer API mediante Vercel Functions

## Arquitectura

- El cliente de React envia operaciones permitidas a `POST /api/gemini`.
- `api/gemini.ts` es el adaptador Web Standard de Vercel; `server/gemini/` separa controlador, servicio, validacion, proveedor Gemini, verificador de ID tokens Firebase y errores HTTP.
- `operations/registry.ts` conecta una estrategia tipada por operación; cada estrategia valida su entrada y respuesta y construye su solicitud al proveedor. Añadir una operación requiere un nuevo contrato/estrategia y registrarla, sin modificar el controlador, el caso de uso ni el transporte.
- El controlador depende de contratos de autenticacion, rate limit y caso de uso; el servicio depende del contrato del proveedor. `handler.ts` es el punto de composición del servidor.
- `FirebaseGeminiAuthenticator` encapsula la verificacion Firebase; el controlador solo recibe un usuario autenticado y no conoce Firebase.
- En el navegador, `GeminiApiClient` depende de un proveedor de ID tokens; `FirebaseGeminiTokenProvider` y el módulo público `GeminiApi/index.ts` componen la autenticacion existente con el cliente HTTP.
- El flujo `procesarProducto` recibe por contrato identidad, procesamiento de imágenes, análisis y persistencia; el punto público conecta los adaptadores Firebase existentes sin alterar sus repositorios ni su esquema.
- La funcion Node.js de Vercel valida la solicitud, verifica el Firebase ID token con las claves publicas oficiales de Firebase Secure Token y rechaza usuarios anonimos.
- El servidor llama a Gemini Developer API REST. El modelo, las instrucciones de producto, los esquemas JSON y los parametros de generacion se controlan en el servidor.
- Firebase Authentication, Firestore, Storage, sus repositorios y reglas permanecen como estan.
- La funcion no usa Firebase Admin SDK, Firebase AI Logic, Cloud Functions ni App Check como requisito de acceso a Gemini.

## Modelo y nivel gratuito

El servidor usa `gemini-3.1-flash-lite`, que admite entrada de texto e imagen y salida JSON estructurada. La documentacion oficial consultada lista el modelo como estable y publica uso gratuito en el Free Tier:

- [Ficha del modelo](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite): entradas de texto e imagen; salida de texto; salida estructurada soportada.
- [Precios de Gemini Developer API](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite): muestra entrada y salida "Free of charge" en Free Tier.
- [Salida estructurada](https://ai.google.dev/gemini-api/docs/structured-output): documenta JSON Schema para respuestas JSON.

El acceso gratuito esta sujeto a disponibilidad, limites y politicas actuales de Google; no es ilimitado. El endpoint detiene las solicitudes cuando recibe `429`; no reintenta ni cambia a un modelo de pago. No se comprobo el saldo/cuota de ninguna cuenta ni se ejecuto una llamada real al proveedor.

Para evitar cargos, el propietario debe usar una clave de un proyecto Gemini Developer API sin facturacion habilitada. Si se vincula facturacion al proyecto, Google puede aplicar las tarifas del nivel pagado despues de los limites gratuitos; la API no ofrece a esta funcion una opcion por solicitud para forzar "solo gratis". El codigo no habilita facturacion, pero no puede detectar ni impedir que un propietario habilite el nivel pagado en el proyecto de Google.

## Variables de entorno

### Local

1. Copia las variables requeridas desde `.env.example` a `.env.local`.
2. Completa las variables `VITE_FIREBASE_*` necesarias para el cliente.
3. Agrega `GEMINI_API_KEY` a `.env.local`. Es una clave privada: no la pongas en una variable `VITE_*`, en `.env` rastreado, en Firestore ni en codigo fuente.
4. No agregues claves de depuracion de App Check al archivo.
5. Ejecuta el servidor con Vercel CLI (`npx vercel dev`) para que el frontend y la funcion `/api/gemini` esten disponibles en el mismo origen. `npm run dev` inicia solamente Vite y no ejecuta la funcion.

La funcion usa `VITE_FIREBASE_PROJECT_ID` para comprobar el `aud` y el `iss` del Firebase ID token. Es un identificador de proyecto, no un secreto.

El archivo `.env` ya estaba rastreado por Git antes de esta migracion, por lo que se retiro del indice y se conserva la copia local. `.gitignore` lo excluye de futuros cambios; no coloques `GEMINI_API_KEY` alli.

### Vercel

En Project Settings > Environment Variables agrega:

- `GEMINI_API_KEY`: clave privada de Google AI Studio. Selecciona solo los entornos que el propietario autorice; no uses prefijo `VITE_`.
- Las variables publicas `VITE_FIREBASE_*` que ya requiere el frontend, incluido `VITE_FIREBASE_PROJECT_ID` y `VITE_FIREBASE_APPCHECK_SITE_KEY` para la inicializacion App Check presente en el arbol local.

No se ha creado ni actualizado ningun entorno de Vercel y no se ha desplegado. Antes de usar Vercel Hobby, el propietario debe confirmar que el uso del proyecto cumple los terminos vigentes del plan.

## Protecciones y errores

- Solo `POST`, JSON, operaciones allowlist y campos definidos son aceptados.
- Se valida el Firebase ID token (firma RS256, `kid`, expiracion, emisor y audiencia del proyecto) usando certificados publicos oficiales con cache HTTP.
- Se rechazan cuentas cuyo proveedor de inicio de sesion es `anonymous`.
- El limite en el cliente no sustituye el control del servidor. La funcion aplica un limite best-effort de 20 solicitudes por usuario/minuto en memoria del proceso.
- Vercel serverless puede escalar entre procesos y reiniciarlos; este limite en memoria no es distribuido ni una proteccion fuerte contra abuso. Para un limite durable/global haria falta un servicio compartido o cambios de infraestructura autorizados.
- Los archivos permitidos son JPEG, PNG y WEBP, maximo 3 MiB cada uno; el limite se ajusta para mantenerse bajo el tamano maximo de solicitudes de funciones Vercel.
- La clave Gemini solo se envia al proveedor desde el servidor, mediante un encabezado HTTPS. No se incluye en respuestas ni se registran prompts, imagenes, tokens o claves.
- Las respuestas JSON del proveedor se validan en el servidor y despues se vuelven a validar con la logica existente del cliente antes de continuar el flujo de FoodBack.
- Un ID token revocado puede seguir siendo aceptado hasta su expiracion: no hay comprobacion de revocacion remota ni Firebase Admin SDK.

Los limites en memoria y el control por cuenta reducen abuso basico, pero no garantizan la cuota gratuita ni impiden abuso por cuentas distintas. La cuota gratuita se agota con un `429` comprensible y no hay activacion de facturacion automatica.

En el Free Tier, Google indica que el contenido puede usarse para mejorar sus productos. No envies datos personales o sensibles en imagenes o solicitudes; revisa las condiciones vigentes antes de usarlo con usuarios reales.

## Validacion local

- `npm run build`
- `npm run test`
- `npx eslint src tests api`
- `npx vercel dev` para probar la ruta local. Las pruebas unitarias no llaman a Gemini ni Firebase de produccion.

Las pruebas con Gemini real requieren una clave privada proporcionada por el propietario y deben ejecutarse localmente con cuota gratuita disponible. No se ejecutan como parte de las pruebas automatizadas.
