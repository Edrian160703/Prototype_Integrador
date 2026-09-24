import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import LoginModal from './components/LoginModal'
import Home from './pages/Home'
import Explorar from './pages/Explorar'
import ComoFunciona from './pages/ComoFunciona'
import Impacto from './pages/Impacto'
import ParaNegocios from './pages/ParaNegocios'
import RegistroNegocio from './pages/RegistroNegocio'
import Onboarding from './pages/Onboarding'
import Perfil from './pages/Perfil'
import SignUpForm from './components/SignUpForm'

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <>
      <Header onOpenLogin={() => setLoginOpen(true)} />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/impacto" element={<Impacto />} />
          <Route path="/para-negocios" element={<ParaNegocios />} />
          <Route path="/registro-negocio" element={<RegistroNegocio />} />
          <Route path="/registro" element={<SignUpForm />} />
          <Route path="/onboarding/:role" element={<Onboarding />} />
          <Route path="/perfil" element={<Perfil />} />
        </Routes>
      </main>

      <Footer />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
