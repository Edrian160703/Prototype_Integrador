import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { getFirebaseAuth, getUserDocument } from '../services/authService'
import type { UserDocument } from '../types/user'

interface AuthContextValue {
  user: User | null
  profile: UserDocument | null
  loading: boolean
  /** Vuelve a leer el documento de Firestore (por ejemplo, después de editar el perfil). */
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserDocument | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const currentUser = getFirebaseAuth().currentUser
    if (!currentUser) return

    try {
      setProfile(await getUserDocument(currentUser.uid))
    } catch (error) {
      // Si falla la lectura se conserva el perfil que ya estaba en pantalla.
      console.error('No se pudo actualizar el perfil', error)
    }
  }, [])

  useEffect(() => {
    // onAuthStateChanged ya restaura la sesión sola al recargar la página
    // (Firebase la guarda internamente); no hace falta leer/escribir localStorage.
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      setUser(firebaseUser)
      setProfile(firebaseUser ? await getUserDocument(firebaseUser.uid) : null)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
