# Firebase App Check

## Alcance actual

`src/infrastructure/firebase/firebaseClient.ts` configura App Check una vez para la instancia Firebase compartida por Authentication, Firestore y Storage. Utiliza el proveedor reCAPTCHA Enterprise configurado en `VITE_FIREBASE_APPCHECK_SITE_KEY` y habilita la renovacion automatica de tokens.

La ruta `/api/gemini` de Vercel no usa Firebase AI Logic ni requiere un token de App Check. El endpoint verifica un Firebase ID token en el servidor antes de aceptar solicitudes de cuentas registradas. App Check sigue aplicando a los servicios Firebase que ya lo utilizan; esta migracion no cambia Firebase Console, las reglas, ni el enforcement.

## Desarrollo local

En desarrollo, el codigo asigna `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` antes de inicializar App Check. Firebase muestra el token de depuracion en la consola del navegador. Registra el token en Firebase Console solo si necesitas probar servicios Firebase protegidos; no lo guardes en el repositorio ni lo agregues a Vercel.

Usa `.env.local` para las variables locales. Consulta [GEMINI_VERCEL.md](./GEMINI_VERCEL.md) para ejecutar conjuntamente Vite y la funcion `/api/gemini` con Vercel CLI.

## Configuracion existente que debe conservarse

- Usa la clave publica de reCAPTCHA Enterprise ya registrada para la aplicacion FoodBack.
- No crees una clave nueva ni amplíes los dominios permitidos de la clave de produccion para localhost.
- App Check no sustituye Firebase Authentication ni las reglas de seguridad de Firestore/Storage.
- No actives enforcement o proteccion contra repeticion sin revisar primero las metricas y obtener autorizacion.

No se han realizado cambios en Firebase Console, App Check, la aplicacion desplegada ni los servicios de produccion.
