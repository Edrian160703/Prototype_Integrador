import { getFirebaseApp } from '../../infrastructure/firebase/firebaseClient'
import { getAI, GoogleAIBackend, getGenerativeModel } from 'firebase/ai'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

export const GEMINI_MODEL = 'gemini-3.8-flash'

let modelPromise: ReturnType<typeof getGenerativeModel> | null = null

export function initializeGeminiAppCheck(): void {
  const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_RECAPTCHA_V3_SITE_KEY
  if (!siteKey) return
  initializeAppCheck(getFirebaseApp(), {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  })
}

export function getGeminiModel() {
  if (!modelPromise) {
    initializeGeminiAppCheck()
    const ai = getAI(getFirebaseApp(), { backend: new GoogleAIBackend() })
    modelPromise = getGenerativeModel(ai, { model: GEMINI_MODEL })
  }
  return modelPromise
}