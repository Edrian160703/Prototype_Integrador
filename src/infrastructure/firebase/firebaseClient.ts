import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function requiredFirebaseEnv(name: string): string {
  const value = import.meta.env[name]

  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${name}`)
  }

  return value
}

export function getFirebaseServices() {
  const firebaseConfig = {
    apiKey: requiredFirebaseEnv('VITE_FIREBASE_API_KEY'),
    authDomain: requiredFirebaseEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: requiredFirebaseEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: requiredFirebaseEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requiredFirebaseEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requiredFirebaseEnv('VITE_FIREBASE_APP_ID'),
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }
  const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)

  return {
    auth: getAuth(firebaseApp),
    db: getFirestore(firebaseApp),
  }
}
