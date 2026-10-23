import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  useAuthStateSubscription,
  useCurrentUserQuery,
  useUserProfileQuery,
} from './ApplicationContext'
import type { AuthIdentity } from '../ports/authGateway'
import type { UserDocument } from '../types/user'

interface AuthSessionValue {
  user: AuthIdentity | null
  loading: boolean
}

interface UserProfileReader {
  profile: UserDocument | null
}

interface UserProfileRefresher {
  /** Vuelve a leer el documento de Firestore (por ejemplo, después de editar el perfil). */
  refreshProfile: () => Promise<void>
}

const AuthSessionContext = createContext<AuthSessionValue | null>(null)
const UserProfileContext = createContext<UserProfileReader | null>(null)
const UserProfileRefreshContext = createContext<UserProfileRefresher | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { getCurrentUser } = useCurrentUserQuery()
  const { subscribeToAuthChanges } = useAuthStateSubscription()
  const { getUserDocument } = useUserProfileQuery()
  const [user, setUser] = useState<AuthIdentity | null>(null)
  const [profile, setProfile] = useState<UserDocument | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) return

    try {
      setProfile(await getUserDocument(currentUser.uid))
    } catch (error) {
      // Si falla la lectura se conserva el perfil que ya estaba en pantalla.
      console.error('No se pudo actualizar el perfil', error)
    }
  }, [getCurrentUser, getUserDocument])

  useEffect(() => {
    // onAuthStateChanged ya restaura la sesión sola al recargar la página
    // (Firebase la guarda internamente); no hace falta leer/escribir localStorage.
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser)
      setProfile(firebaseUser ? await getUserDocument(firebaseUser.uid) : null)
      setLoading(false)
    })
    return unsubscribe
  }, [getUserDocument, subscribeToAuthChanges])

  return (
    <AuthSessionContext.Provider value={{ user, loading }}>
      <UserProfileContext.Provider value={{ profile }}>
        <UserProfileRefreshContext.Provider value={{ refreshProfile }}>
          {children}
        </UserProfileRefreshContext.Provider>
      </UserProfileContext.Provider>
    </AuthSessionContext.Provider>
  )
}

export function useAuthSession(): AuthSessionValue {
  const context = useContext(AuthSessionContext)
  if (!context) throw new Error('useAuthSession must be used within an AuthProvider.')
  return context
}

export function useUserProfile(): UserProfileReader {
  const context = useContext(UserProfileContext)
  if (!context) throw new Error('useUserProfile must be used within an AuthProvider.')
  return context
}

export function useRefreshUserProfile(): UserProfileRefresher {
  const context = useContext(UserProfileRefreshContext)
  if (!context) throw new Error('useRefreshUserProfile must be used within an AuthProvider.')
  return context
}
