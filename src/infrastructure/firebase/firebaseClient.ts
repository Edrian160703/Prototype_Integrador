
import {
  getApps,
  initializeApp,
  type FirebaseApp,
} from 'firebase/app'

import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check'

import { getAuth } from 'firebase/auth'

/**
 * Evita inicializar App Check más de una vez
 * durante la ejecución del módulo.
 */
let appCheckInitialized = false

/**
 * Obtiene una variable de entorno obligatoria.
 */
function requiredFirebaseEnv(name: string): string {
  const value = import.meta.env[name]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `Missing Firebase environment variable: ${name}`,
    )
  }

  return value.trim()
}

/**
 * Inicializa Firebase App Check.
 *
 * DESARROLLO:
 * Utiliza el mecanismo oficial de Debug Token de Firebase.
 *
 * PRODUCCIÓN:
 * Utiliza exclusivamente reCAPTCHA Enterprise.
 */
function initializeFirebaseAppCheck(app: FirebaseApp): void {
  if (appCheckInitialized) return

  const siteKey = requiredFirebaseEnv(
    'VITE_FIREBASE_APPCHECK_SITE_KEY',
  )

  if (import.meta.env.DEV) {
    // Activa el modo Debug antes de inicializar App Check.
    (self as typeof self & {
      FIREBASE_APPCHECK_DEBUG_TOKEN: boolean
    }).FIREBASE_APPCHECK_DEBUG_TOKEN = true

    console.info(
      '[Firebase App Check] Modo Debug habilitado para desarrollo local.',
    )
  }

  const provider = new ReCaptchaEnterpriseProvider(siteKey)

  initializeAppCheck(app, {
    provider,
    isTokenAutoRefreshEnabled: true,
  })

  appCheckInitialized = true
}

/**
 * Inicializa o recupera la instancia principal de Firebase.
 */
export function getFirebaseApp(): FirebaseApp {
  const firebaseConfig = {
    apiKey: requiredFirebaseEnv('VITE_FIREBASE_API_KEY'),
    authDomain: requiredFirebaseEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requiredFirebaseEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: requiredFirebaseEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requiredFirebaseEnv(
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
    ),
    appId: requiredFirebaseEnv('VITE_FIREBASE_APP_ID'),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }

  const existingApps = getApps()

  const app =
    existingApps.length > 0
      ? existingApps[0]
      : initializeApp(firebaseConfig)

  initializeFirebaseAppCheck(app)

  return app
}

/**
 * Obtiene Firebase Authentication.
 */
export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

/**
 * Verifica que el usuario tenga el custom claim de administrador.
 */
export async function assertFirebaseAdmin(): Promise<void> {
  const user = getFirebaseAuth().currentUser

  if (!user) {
    throw new Error(
      'Debes iniciar sesión para acceder a las operaciones administrativas.',
    )
  }

  const token = await user.getIdTokenResult(true)

  if (token.claims.admin !== true) {
    throw new Error(
      'No tienes permiso para ejecutar operaciones administrativas.',
    )
  }
}

/**
 * Obtiene Firebase Firestore.
 */
export async function getFirebaseFirestore() {
  const { getFirestore } = await import('firebase/firestore')

  return getFirestore(getFirebaseApp())
}
