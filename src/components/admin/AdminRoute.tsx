import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthSession } from '../../context/AuthContext'

/**
 * Componente encargado de envolver paginas de administrador. 
 * Verifica si la cuenta creada pertenece a un administrador antes de mostrar informacion.
 * @param children Pagina a proteger
 * @returns children si el usuario es administrador
 */

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuthSession()

  if (loading) return (
    <div className="loader"></div>
  )
  if (!user) return <Navigate to="/" replace />
  if (!isAdmin) return <div className='forbidden'>Access is forbidden</div>
  return children
}
