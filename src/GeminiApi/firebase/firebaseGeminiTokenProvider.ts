import { getFirebaseAuth } from '../../infrastructure/firebase/firebaseClient'
import type { CurrentUserProvider } from '../services/procesarProducto'
import type { GeminiTokenProvider } from '../services/geminiClient'

export class FirebaseGeminiTokenProvider implements GeminiTokenProvider, CurrentUserProvider {
  getUserId(): string | null {
    return getFirebaseAuth().currentUser?.uid ?? null
  }

  async getIdToken(): Promise<string | null> {
    const user = getFirebaseAuth().currentUser
    return user ? user.getIdToken() : null
  }
}
