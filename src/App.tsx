import { lazy, Suspense, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import AdminRoute from './components/admin/AdminRoute'

const LoginModal = lazy(() => import('./components/LoginModal'))
const SignUpForm = lazy(() => import('./components/SignUpForm'))
const Home = lazy(() => import('./pages/Home'))
const Explorar = lazy(() => import('./pages/Explorar'))
const ComoFunciona = lazy(() => import('./pages/ComoFunciona'))
const Impacto = lazy(() => import('./pages/Impacto'))
const ParaNegocios = lazy(() => import('./pages/ParaNegocios'))
const RegistroNegocio = lazy(() => import('./pages/RegistroNegocio'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Perfil = lazy(() => import('./pages/Perfil'))
const Publicar = lazy(() => import('./pages/Publicar'))
const ReservaExclusiva = lazy(() => import('./pages/ReservaExclusiva'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <>
      <Header onOpenLogin={() => setLoginOpen(true)} />

      <main>
        <Suspense fallback={<div role="status">Cargando página…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explorar" element={<Explorar />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />
            <Route path="/impacto" element={<Impacto />} />
            <Route path="/para-negocios" element={<ParaNegocios />} />
            <Route path="/registro-negocio" element={<RegistroNegocio />} />
            <Route path="/registro" element={<SignUpForm />} />
            <Route path="/onboarding" element={<Navigate to="/registro" replace />} />
            <Route path="/onboarding/:role" element={<Onboarding />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/publicar" element={<Publicar />} />
            <Route path="/reserva/:id" element={<ReservaExclusiva />} />
<<<<<<< HEAD
            <Route path="/admin" element={<AdminDashboard />} />
=======
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
>>>>>>> rama-diego
          </Routes>
        </Suspense>
      </main>

      <Footer />

      {loginOpen && (
        <Suspense fallback={null}>
          <LoginModal onClose={() => setLoginOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
