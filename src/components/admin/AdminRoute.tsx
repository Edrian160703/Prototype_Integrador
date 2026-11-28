import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthSession } from '../../context/AuthContext'
import { assertFirebaseAdmin } from '../../infrastructure/firebase/firebaseClient'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthSession()
  const uid = user?.uid
  const [access, setAccess] = useState<{ uid: string; authorized: boolean } | null>(null)

  useEffect(() => {
    let active = true
    if (typeof uid !== 'string') return () => { active = false }
    const verifiedUid = uid

    async function verifyAdminClaim() {
      try {
        await assertFirebaseAdmin()
        if (active) setAccess({ uid: verifiedUid, authorized: true })
      } catch (error) {
        console.error('No se pudo verificar el acceso al panel administrativo.', error)
        if (active) setAccess({ uid: verifiedUid, authorized: false })
      }
    }

    void verifyAdminClaim()
    return () => { active = false }
  }, [uid])

  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  if (access?.uid !== user.uid) return <div className="admin-loading" role="status">Verificando permisos…</div>
  if (!access.authorized) return <Navigate to="/" replace />
  return children
}
