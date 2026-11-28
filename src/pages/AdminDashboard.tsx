import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthSession } from "../context/AuthContext";
import { getFirebaseAuth } from "../infrastructure/firebase/firebaseClient";
import useAdminDashboard, { type AdminTab } from "../hooks/useAdminDashboard";
import AccountsPanel, { type ManagedAccount } from "../components/admin/AccountsPanel";
import ProductsPanel from "../components/admin/ProductsPanel";
import ReservationsPanel from "../components/admin/ReservationsPanel";
import OffersPanel from "../components/admin/OffersPanel";
import "../styles/admin-dashboard.css";
import type { ProductoAdminItem } from "../types/productoAdmin";
import type { ReservaDocument } from "../types/reserva";
import type { OfertaConComercio } from "../types/oferta";
import AdminOverview from "../components/admin/AdminOverview";
import AdminAccountInspector from "../components/admin/AdminAccountInspector";

const TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: "resumen", label: "Resumen", icon: "📊" },
  { key: "usuarios", label: "Consumidores", icon: "👤" },
  { key: "comercios", label: "Comercios", icon: "🏪" },
  { key: "productos", label: "Productos", icon: "📦" },
  { key: "reservas", label: "Reservas", icon: "🧾" },
  { key: "ofertas", label: "Ofertas", icon: "🏷️" },
];

interface AdminSnapshot {
  users: ManagedAccount[] | null;
  stores: ManagedAccount[] | null;
  products: ProductoAdminItem[] | null;
  reservations: ReservaDocument[] | null;
  offers: OfertaConComercio[] | null;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuthSession();
  const uid = user?.uid;
  const [access, setAccess] = useState<"checking" | "granted" | "denied" | "error">(
    "checking",
  );
  const [checkedUid, setCheckedUid] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (authLoading || !uid) return () => { active = false; };
    const verifiedUid = uid;

    async function checkAdminClaim() {
      try {
        const currentUser = getFirebaseAuth().currentUser;
        if (!currentUser || currentUser.uid !== verifiedUid) {
          throw new Error("La sesión de Firebase no está disponible.")
        }
        const token = await currentUser.getIdTokenResult(true);
        if (active) {
          setAccess(token.claims.admin === true ? "granted" : "denied");
          setCheckedUid(verifiedUid);
        }
      } catch (error) {
        console.error("No se pudo verificar el permiso de administrador.", error);
        if (active) {
          setAccess("error");
          setCheckedUid(verifiedUid);
        }
      }
    }

    void checkAdminClaim();
    return () => {
      active = false;
    };
  }, [authLoading, uid]);

  if (authLoading) {
    return <p className="admin-loading">Verificando acceso administrativo…</p>;
  }
  if (!user) return <Navigate to="/" replace />;
  if (access === "checking" || checkedUid !== user.uid) {
    return <p className="admin-loading">Verificando acceso administrativo…</p>;
  }
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
    offers,
    loadError,
    handleUserStatusChange,
    handleUserDelete,
    handleStoreStatusChange,
    handleStoreDelete,
    handleProductStatusChange,
    handleProductDelete,
    handleProductEvidenceRead,
    handleReservationStatusChange,
    handleReservationDelete,
  } = useAdminDashboard();
  const [selectedAccount, setSelectedAccount] = useState<ManagedAccount | null>(null);
  const [snapshotOverrides, setSnapshotOverrides] = useState<
    Partial<AdminSnapshot>
  >({});
  const snapshot: AdminSnapshot = {
    users: snapshotOverrides.users ?? users,
    stores: snapshotOverrides.stores ?? stores,
    products: snapshotOverrides.products ?? products,
    reservations: snapshotOverrides.reservations ?? reservations,
    offers: snapshotOverrides.offers ?? offers,
  };

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
        <div className="stat-card admin-platform-stat-consumer">
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
        <div className="stat-card admin-platform-stat-commerce">
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
        <div className="stat-card admin-platform-stat-product">
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
        <div className="stat-card admin-platform-stat-reservation">
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

      <div className="admin-workspace">
        <nav
          className="admin-tabs"
          role="tablist"
          aria-orientation="vertical"
          aria-label="Secciones del panel"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`admin-tab-${tab.key}`}
              aria-controls={`admin-panel-${tab.key}`}
              aria-selected={activeTab === tab.key}
              className={`admin-tab${activeTab === tab.key ? " admin-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="admin-panels">
          <div
            className="admin-tab-panel"
            id="admin-panel-resumen"
            role="tabpanel"
            aria-labelledby="admin-tab-resumen"
            hidden={activeTab !== "resumen"}
          >
            <AdminOverview
              users={snapshot.users}
              stores={snapshot.stores}
              reservations={snapshot.reservations}
              offers={snapshot.offers}
              onSelectAccount={setSelectedAccount}
              onSelectTab={setActiveTab}
            />
          </div>

          {activeTab === "usuarios" && (
            <div
              className="admin-tab-panel"
              id="admin-panel-usuarios"
              role="tabpanel"
              aria-labelledby="admin-tab-usuarios"
            >
              {snapshot.users === null ? (
                <p className="admin-loading">Cargando consumidores…</p>
              ) : (
                <AccountsPanel
                  entityLabel="consumidor"
                  entityLabelPlural="consumidores"
                  initialAccounts={snapshot.users}
                  onStatusChange={handleUserStatusChange}
                  onDelete={handleUserDelete}
                  onAccountsChange={(items) =>
                    setSnapshotOverrides((current) => ({ ...current, users: items }))
                  }
                />
              )}
            </div>
          )}

          {activeTab === "comercios" && (
            <div
              className="admin-tab-panel"
              id="admin-panel-comercios"
              role="tabpanel"
              aria-labelledby="admin-tab-comercios"
            >
              {snapshot.stores === null ? (
                <p className="admin-loading">Cargando comercios…</p>
              ) : (
                <AccountsPanel
                  entityLabel="comercio"
                  entityLabelPlural="comercios"
                  initialAccounts={snapshot.stores}
                  onStatusChange={handleStoreStatusChange}
                  onDelete={handleStoreDelete}
                  onAccountsChange={(items) =>
                    setSnapshotOverrides((current) => ({ ...current, stores: items }))
                  }
                />
              )}
            </div>
          )}

          {activeTab === "productos" && (
            <div
              className="admin-tab-panel"
              id="admin-panel-productos"
              role="tabpanel"
              aria-labelledby="admin-tab-productos"
            >
              {snapshot.products === null ? (
                <p className="admin-loading">Cargando productos…</p>
              ) : (
                <ProductsPanel
                  initialProducts={snapshot.products}
                  onStatusChange={handleProductStatusChange}
                  onDelete={handleProductDelete}
                  onLoadExpirationEvidence={handleProductEvidenceRead}
                  onProductsChange={(items) =>
                    setSnapshotOverrides((current) => ({ ...current, products: items }))
                  }
                />
              )}
            </div>
          )}

          {activeTab === "reservas" && (
            <div
              className="admin-tab-panel"
              id="admin-panel-reservas"
              role="tabpanel"
              aria-labelledby="admin-tab-reservas"
            >
              {reservations === null ? (
                <p className="admin-loading" role={loadError ? "alert" : undefined}>
                  {loadError ? "No pudimos cargar las reservas." : "Cargando reservas…"}
                </p>
              ) : (
                <ReservationsPanel
                  initialReservations={reservations}
                  onStatusChange={handleReservationStatusChange}
                  onDelete={handleReservationDelete}
                  onReservationsChange={(items) =>
                    setSnapshotOverrides((current) => ({ ...current, reservations: items }))
                  }
                />
              )}
            </div>
          )}

          {activeTab === "ofertas" && (
            <div
              className="admin-tab-panel"
              id="admin-panel-ofertas"
              role="tabpanel"
              aria-labelledby="admin-tab-ofertas"
            >
              {snapshot.offers === null ? (
                <p className="admin-loading" role={loadError ? "alert" : undefined}>
                  {loadError ? "No pudimos cargar las ofertas." : "Cargando ofertas…"}
                </p>
              ) : (
                <OffersPanel offers={snapshot.offers} />
              )}
            </div>
          )}
        </div>
      </div>

      {selectedAccount && (
        <AdminAccountInspector
          account={selectedAccount}
          products={snapshot.products}
          offers={snapshot.offers}
          reservations={snapshot.reservations}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </section>
  );
}
