import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthSession } from '../../context/AuthContext'
import { assertFirebaseAdmin } from '../../infrastructure/firebase/firebaseClient'

/**
 * Componente encargado de envolver paginas de administrador. 
 * Verifica si la cuenta creada pertenece a un administrador antes de mostrar informacion.
 * @param children Pagina a proteger
 * @returns children si el usuario es administrador
 */

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

  if (loading) return (
    <div className="loader"></div>
  )
  if (!user) return <Navigate to="/" replace />
  if (access?.uid !== user.uid) return <div className="loader"></div>
  if (!access.authorized) return <div className='forbidden'>Access is forbidden</div>
  return children
}
