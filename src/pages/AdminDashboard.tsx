import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthSession } from "../context/AuthContext";
import { getFirebaseAuth } from "../infrastructure/firebase/firebaseClient";
import useAdminDashboard, { type AdminTab } from "../hooks/useAdminDashboard";
import AccountsPanel from "../components/admin/AccountsPanel";
import ProductsPanel from "../components/admin/ProductsPanel";
import ReservationsPanel from "../components/admin/ReservationsPanel";
import "../styles/admin-dashboard.css";

const TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: "usuarios", label: "Consumidores", icon: "👤" },
  { key: "comercios", label: "Comercios", icon: "🏪" },
  { key: "productos", label: "Productos", icon: "📦" },
  { key: "reservas", label: "Reservas", icon: "🧾" },
];

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuthSession();
  const [access, setAccess] = useState<"checking" | "granted" | "denied" | "error">(
    "checking",
  );
  const [checkedUid, setCheckedUid] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (authLoading) return;
    if (!user) {
      setAccess("denied");
      return;
    }
    const uid = user.uid;

    setAccess("checking");
    async function checkAdminClaim() {
      try {
        const currentUser = getFirebaseAuth().currentUser;
        if (!currentUser || currentUser.uid !== uid) {
          throw new Error("La sesión de Firebase no está disponible.")
        }
        const token = await currentUser.getIdTokenResult(true);
        if (active) {
          setAccess(token.claims.admin === true ? "granted" : "denied");
          setCheckedUid(uid);
        }
      } catch (error) {
        console.error("No se pudo verificar el permiso de administrador.", error);
        if (active) {
          setAccess("error");
          setCheckedUid(uid);
        }
      }
    }

    void checkAdminClaim();
    return () => {
      active = false;
    };
  }, [authLoading, user?.uid]);

  if (authLoading || access === "checking" || (user && checkedUid !== user.uid)) {
    return <p className="admin-loading">Verificando acceso administrativo…</p>;
  }
  if (!user) return <Navigate to="/" replace />;
  if (access === "denied") {
    return (
      <section className="admin-page">
        <div className="admin-error-banner" role="alert">
          Esta cuenta no tiene permisos de administrador.
        </div>
      </section>
    );
  }
  if (access === "error") {
    return (
      <section className="admin-page">
        <div className="admin-error-banner" role="alert">
          No se pudo verificar tu acceso. Vuelve a iniciar sesión e inténtalo de nuevo.
        </div>
      </section>
    );
  }

  return <AdminDashboardContent />;
}

function AdminDashboardContent() {
  const {
    activeTab,
    setActiveTab,
    users,
    stores,
    products,
    reservations,
    loadError,
    handleUserStatusChange,
    handleUserDelete,
    handleStoreStatusChange,
    handleStoreDelete,
    handleProductStatusChange,
    handleProductDelete,
    handleReservationStatusChange,
    handleReservationDelete,
  } = useAdminDashboard();
  const [snapshot, setSnapshot] = useState<{
    users: ManagedAccount[] | null;
    stores: ManagedAccount[] | null;
    products: ProductoAdminItem[] | null;
    reservations: ReservaDocument[] | null;
  }>({
    users: null,
    stores: null,
    products: null,
    reservations: null,
  });

  useEffect(() => {
    setSnapshot({ users, stores, products, reservations });
  }, [users, stores, products, reservations]);

  return (
    <section className="admin-page">
      <header className="admin-hero">
        <div className="admin-hero-copy">
          <span className="admin-kicker">Panel de administrador</span>
          <h1>Gestión de la plataforma</h1>
          <p>Consulta y administra registros de la plataforma en Firestore.</p>
        </div>
      </header>

      {loadError && <div className="admin-error-banner">{loadError}</div>}

      <div className="admin-stats admin-global-stats" aria-label="Resumen de la plataforma">
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">👤</span>
          <div>
            <p className="stat-value">
              {snapshot.users === null
                ? "…"
                : snapshot.users.filter((account) => account.status === "activa").length}
            </p>
            <p className="stat-label">Consumidores activos</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">🏪</span>
          <div>
            <p className="stat-value">
              {snapshot.stores === null
                ? "…"
                : snapshot.stores.filter((account) => account.status === "activa").length}
            </p>
            <p className="stat-label">Comercios activos</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">📦</span>
          <div>
            <p className="stat-value">
              {snapshot.products === null
                ? "…"
                : snapshot.products.filter((product) => product.status === "activo").length}
            </p>
            <p className="stat-label">Productos activos</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">🕓</span>
          <div>
            <p className="stat-value">
              {snapshot.reservations === null
                ? "…"
                : snapshot.reservations.filter(
                    (reservation) => reservation.estado_reserva === "pendiente",
                  ).length}
            </p>
            <p className="stat-label">Reservas pendientes</p>
          </div>
        </div>
      </div>

      <nav
        className="admin-tabs"
        role="tablist"
        aria-label="Secciones del panel"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`admin-tab${activeTab === tab.key ? " admin-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "usuarios" &&
        (snapshot.users === null ? (
          <p className="admin-loading">Cargando consumidores…</p>
        ) : (
          <AccountsPanel
            entityLabel="consumidor"
            entityLabelPlural="consumidores"
            initialAccounts={snapshot.users}
            onStatusChange={handleUserStatusChange}
            onDelete={handleUserDelete}
            onAccountsChange={(items) =>
              setSnapshot((current) => ({ ...current, users: items }))
            }
          />
        ))}

      {activeTab === "comercios" &&
        (snapshot.stores === null ? (
          <p className="admin-loading">Cargando comercios…</p>
        ) : (
          <AccountsPanel
            entityLabel="comercio"
            entityLabelPlural="comercios"
            initialAccounts={snapshot.stores}
            onStatusChange={handleStoreStatusChange}
            onDelete={handleStoreDelete}
            onAccountsChange={(items) =>
              setSnapshot((current) => ({ ...current, stores: items }))
            }
          />
        ))}

      {activeTab === "productos" &&
        (snapshot.products === null ? (
          <p className="admin-loading">Cargando productos…</p>
        ) : (
          <ProductsPanel
            initialProducts={snapshot.products}
            onStatusChange={handleProductStatusChange}
            onDelete={handleProductDelete}
          />
        ))}

      {activeTab === "reservas" &&
        (reservations === null ? (
          <p className="admin-loading" role={loadError ? "alert" : undefined}>
            {loadError ? "No pudimos cargar las reservas." : "Cargando reservas…"}
          </p>
        ) : (
          <ReservationsPanel
            initialReservations={reservations}
            onStatusChange={handleReservationStatusChange}
            onDelete={handleReservationDelete}
          />
        ))}
    </section>
  );
}
