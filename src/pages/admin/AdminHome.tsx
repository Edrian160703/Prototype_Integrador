import { lazy, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminSidebar, {
  SIDEBAR_ITEMS,
} from "../../components/admin/AdminSidebar";
import AdminResumen from "../../components/admin/AdminResumen";
import AdminRoute from "../../components/admin/AdminRoute";
import AdminNuevos from "../../components/admin/AdminNuevos";

const AdminGestion = lazy(() => import("../../components/admin/AdminGestion"));

export default function AdminHome() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSmallScreen, setIsSmallScreen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1440 : false,
  );

  const defaultKey = useMemo(() => {
    const hashKey = location.hash.replace("#", "").trim();
    return SIDEBAR_ITEMS.some((item) => item.key === hashKey)
      ? hashKey
      : "resumen";
  }, [location.hash]);

  const [sidebarActive, setSidebarActive] = useState(defaultKey);

  useEffect(() => {
    setSidebarActive(defaultKey);
  }, [defaultKey]);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1440);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function handleSidebarSelect(selectedKey: string) {
    const selectedItem = SIDEBAR_ITEMS.find((item) => item.key === selectedKey);
    if (!selectedItem) return;

    setSidebarActive(selectedKey);
    navigate(
      { pathname: location.pathname, hash: selectedItem.key },
      { replace: false },
    );
  }

  const sections = {
    resumen: <AdminResumen key="resumen" />,
    nuevos: <AdminNuevos key="nuevos" />,
    gestionar: <AdminGestion key="gestionar" />,
    estadisticas: <AdminResumen key="estadisticas" />,
  } as const;

  return (
    <AdminRoute>
      <div
        className={`admin-shell-layout${isSmallScreen ? " admin-shell-layout-hidden" : ""}`}
      >
        <AdminSidebar
          activeItem={sidebarActive}
          onSelect={handleSidebarSelect}
        />

        <div className="admin-content">
          {Object.entries(sections).map(([key, section]) => (
            <div
              key={key}
              className={`admin-section ${sidebarActive === key ? "admin-section-active" : "admin-section-hidden"}`}
            >
              {section}
            </div>
          ))}
        </div>
      </div>
      {isSmallScreen && (
        <div className="admin-screen-warning">
          <p>Amplía la pantalla para continuar.</p>
        </div>
      )}
    </AdminRoute>
  );
}
