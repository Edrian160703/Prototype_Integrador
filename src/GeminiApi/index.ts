import { FirebaseGeminiTokenProvider } from './firebase/firebaseGeminiTokenProvider'
import { createAnalizarVencimiento } from './services/analizarVencimiento'
import { GeminiApiClient } from './services/geminiClient'
import { createProcesarProducto } from './services/procesarProducto'
import { createValidarAlimento } from './services/validarAlimento'
import { fileToInlineData } from './utils/convertirImagen'
import { validateImage } from './utils/validarImagen'
import { FirebaseGeminiAnalysisRepository } from '../infrastructure/firebase/FirebaseGeminiAnalysisRepository'

export * from './types/alimento.types'
export * from './types/vencimiento.types'
export * from './types/analisis.types'
export { parseResultadoAlimento } from './services/validarAlimento'
export { parseResultadoVencimiento } from './services/analizarVencimiento'
export * from './utils/validarImagen'
export * from './utils/validarFecha'

const firebaseGeminiAuth = new FirebaseGeminiTokenProvider()
const firebaseGeminiAnalysisRepository = new FirebaseGeminiAnalysisRepository()
const geminiClient = new GeminiApiClient(firebaseGeminiAuth)
const validarAlimento = createValidarAlimento(geminiClient)
const analizarVencimiento = createAnalizarVencimiento(geminiClient)

export { validarAlimento, analizarVencimiento }
export const generateText = geminiClient.generateText.bind(geminiClient)
export const procesarProducto = createProcesarProducto({
  currentUser: firebaseGeminiAuth,
  images: {
    validate: validateImage,
    toInlineData: fileToInlineData,
  },
  analyzers: {
    validateFood: validarAlimento,
    analyzeExpiration: analizarVencimiento,
  },
  repository: firebaseGeminiAnalysisRepository,
})
export type { ProcesarProductoResultado } from './services/procesarProducto'
