import { useAuthSession } from "../context/AuthContext";
import useAdminDashboard, { type AdminTab } from "../hooks/useAdminDashboard";
import AccountsPanel from "../components/admin/AccountsPanel";
import ProductsPanel from "../components/admin/ProductsPanel";
import "../styles/admin-dashboard.css";

const TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: "usuarios", label: "Usuarios", icon: "👤" },
  { key: "comercios", label: "Comercios", icon: "🏪" },
  { key: "productos", label: "Productos", icon: "📦" },
];

export default function AdminDashboard() {
  const { loading: authLoading } = useAuthSession();
  const {
    activeTab,
    setActiveTab,
    users,
    stores,
    products,
    loadError,
    handleUserStatusChange,
    handleUserDelete,
    handleStoreStatusChange,
    handleStoreDelete,
    handleProductStatusChange,
    handleProductDelete,
  } = useAdminDashboard();

  if (authLoading) return null;

  return (
    <section className="admin-page">
      <header className="admin-hero">
        <div className="admin-hero-copy">
          <span className="admin-kicker">Panel de administrador</span>
          <h1>Gestión de la plataforma</h1>
          <p>Usuarios y comercios se leen en vivo desde Firestore.</p>
        </div>
      </header>

      {loadError && <div className="admin-error-banner">{loadError}</div>}

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
        (users === null ? (
          <p className="admin-loading">Cargando usuarios…</p>
        ) : (
          <AccountsPanel
            entityLabel="usuario"
            entityLabelPlural="usuarios"
            initialAccounts={users}
            onStatusChange={handleUserStatusChange}
            onDelete={handleUserDelete}
          />
        ))}

      {activeTab === "comercios" &&
        (stores === null ? (
          <p className="admin-loading">Cargando comercios…</p>
        ) : (
          <AccountsPanel
            entityLabel="comercio"
            entityLabelPlural="comercios"
            initialAccounts={stores}
            onStatusChange={handleStoreStatusChange}
            onDelete={handleStoreDelete}
          />
        ))}

      {activeTab === "productos" &&
        (products === null ? (
          <p className="admin-loading">Cargando productos…</p>
        ) : (
          <ProductsPanel
            initialProducts={products}
            onStatusChange={handleProductStatusChange}
            onDelete={handleProductDelete}
          />
        ))}
    </section>
  );
}
