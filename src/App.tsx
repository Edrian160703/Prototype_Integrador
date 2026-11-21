import { lazy, Suspense, useLayoutEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AdminHeader from "./components/admin/AdminHeader";
import adminGlobalStyles from "./styles/admin/admin-global.css?inline";
import adminGestionStyles from "./styles/admin/admin-gestion.css?inline";
import adminResumenStyles from "./styles/admin/admin-resumen.css?inline";
import adminSidebarStyles from "./styles/admin/admin-sidebar.css?inline";
import confirmDialogStyles from "./styles/confirm-dialog.css?inline";

const LoginModal = lazy(() => import("./components/LoginModal"));
const SignUpForm = lazy(() => import("./components/SignUpForm"));
const Home = lazy(() => import("./pages/Home"));
const Explorar = lazy(() => import("./pages/Explorar"));
const ComoFunciona = lazy(() => import("./pages/ComoFunciona"));
const Impacto = lazy(() => import("./pages/Impacto"));
const ParaNegocios = lazy(() => import("./pages/ParaNegocios"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Publicar = lazy(() => import("./pages/Publicar"));
const ReservaExclusiva = lazy(() => import("./pages/ReservaExclusiva"));

const AdminHome = lazy(() => import("./pages/admin/AdminHome"));

interface AppProps {
  loginOpen: boolean;
  onOpenLogin: () => void;
  onCloseLogin: () => void;
}

// Para paginas de acceso publico
function PublicShell({ loginOpen, onOpenLogin, onCloseLogin }: AppProps) {
  return (
    <>
      <Header onOpenLogin={onOpenLogin} />

      <main>
        <Suspense fallback={<div role="status">Cargando página…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explorar" element={<Explorar />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />
            <Route path="/impacto" element={<Impacto />} />
            <Route path="/para-negocios" element={<ParaNegocios />} />
            <Route
              path="/registro-negocio"
              element={<Navigate to="/registro?rol=comercio" replace />}
            />
            <Route path="/registro" element={<SignUpForm />} />
            <Route
              path="/onboarding"
              element={<Navigate to="/registro" replace />}
            />
            <Route path="/onboarding/:role" element={<Onboarding />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/publicar" element={<Publicar />} />
            <Route path="/reserva/:id" element={<ReservaExclusiva />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />

      {loginOpen && (
        <Suspense fallback={null}>
          <LoginModal onClose={onCloseLogin} />
        </Suspense>
      )}
    </>
  );
}

/**
 * Para paginas de administrador.
 * Cada nueva ruta debe usar {@link AdminRoute} como proteccion.
 */

function AdminShell({ loginOpen, onCloseLogin }: AppProps) {
  useLayoutEffect(() => {
    const adminStyles = document.createElement("style");
    adminStyles.dataset.adminShellStyles = "true";
    adminStyles.textContent = [
      adminGlobalStyles,
      adminGestionStyles,
      adminResumenStyles,
      adminSidebarStyles,
      confirmDialogStyles,
    ].join("\n");
    document.head.append(adminStyles);

    return () => {
      adminStyles.remove();
    };
  }, []);

  return (
    <>
      <AdminHeader />
      <main>
        <Suspense fallback={<div role="status">Cargando página…</div>}>
          <Routes>
            <Route path="/admin" element={<AdminHome />} />
          </Routes>
        </Suspense>
      </main>

      {loginOpen && (
        <Suspense fallback={null}>
          <LoginModal onClose={onCloseLogin} />
        </Suspense>
      )}
    </>
  );
}

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false);
  const isAdminRoute = useLocation().pathname.startsWith("/admin");

  return isAdminRoute ? (
    <AdminShell
      loginOpen={loginOpen}
      onOpenLogin={() => setLoginOpen(true)}
      onCloseLogin={() => setLoginOpen(false)}
    />
  ) : (
    <PublicShell
      loginOpen={loginOpen}
      onOpenLogin={() => setLoginOpen(true)}
      onCloseLogin={() => setLoginOpen(false)}
    />
  );
}
