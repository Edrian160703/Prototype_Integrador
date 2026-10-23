import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import PublicarOfertaForm from '../components/PublicarOfertaForm'
import '../styles/perfil.css'
import '../styles/publicar.css'

export default function Publicar() {
  const { profile, loading } = useAuth()

  if (loading) return null

  // Solo los comercios pueden acceder a esta vista.
  if (!profile || profile.role !== 'store') {
    return <Navigate to="/" replace />
  }

  return (
    <section className="container publicar-page">
      <header className="publicar-header">
        <h1>Publicar nueva oferta</h1>
        <p>Aquí podrás crear una nueva publicación de excedentes para tu comercio.</p>
      </header>

      <PublicarOfertaForm />
    </section>
  )
}
