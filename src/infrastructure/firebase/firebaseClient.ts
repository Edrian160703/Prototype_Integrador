import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { getAuth } from 'firebase/auth'

function requiredFirebaseEnv(name: string): string {
  const value = import.meta.env[name]

  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${name}`)
  }

  return value
}

function initAppCheck(app: FirebaseApp) {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
  if (!siteKey) return

  if (import.meta.env.DEV) {
    // Token de depuración para localhost: se imprime en la consola del navegador y se registra en Firebase.
    ;(self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  })
}

export function getFirebaseApp() {
  const firebaseConfig = {
    apiKey: requiredFirebaseEnv('VITE_FIREBASE_API_KEY'),
    authDomain: requiredFirebaseEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requiredFirebaseEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: requiredFirebaseEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requiredFirebaseEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requiredFirebaseEnv('VITE_FIREBASE_APP_ID'),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }

  if (getApps().length > 0) return getApps()[0]

  const app = initializeApp(firebaseConfig)
  initAppCheck(app)
  return app
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

export async function assertFirebaseAdmin(): Promise<void> {
  const user = getFirebaseAuth().currentUser
  if (!user) {
    throw new Error('Debes iniciar sesión para acceder a las operaciones administrativas.')
  }

  const token = await user.getIdTokenResult(true)
  if (token.claims.admin !== true) {
    throw new Error('No tienes permiso para ejecutar operaciones administrativas.')
  }
}

export async function getFirebaseFirestore() {
  const { getFirestore } = await import('firebase/firestore')
  return getFirestore(getFirebaseApp())
}
