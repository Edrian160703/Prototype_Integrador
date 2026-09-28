import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AccountsPanel from "../components/admin/AccountsPanel";
import ProductsPanel, { Product } from "../components/admin/ProductsPanel";
import {
  listUsers,
  listStores,
  setAccountStatus,
  deleteAccountDocument,
  type ManagedAccount,
  type AccountStatus,
} from "../services/accounts";
import {
  getAllProductosForAdmin,
  updateProductoEstado,
  deleteProducto,
} from "../services/productoService";
import type { ProductStatus } from "../components/admin/ProductsPanel";
import "../styles/admin-dashboard.css";

type TabKey = "usuarios" | "comercios" | "productos";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "usuarios", label: "Usuarios", icon: "👤" },
  { key: "comercios", label: "Comercios", icon: "🏪" },
  { key: "productos", label: "Productos", icon: "📦" },
];

export default function AdminDashboard() {
  const { loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("usuarios");

  const [users, setUsers] = useState<ManagedAccount[] | null>(null);
  const [stores, setStores] = useState<ManagedAccount[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [usersData, storesData, productsData] = await Promise.all([
          listUsers(),
          listStores(),
          getAllProductosForAdmin(),
        ]);
        if (active) {
          setUsers(usersData);
          setStores(storesData);
          setProducts(productsData);
        }
      } catch (e) {
        if (active) {
          //  por alguna razon suelta el error "FirebaseError: Missing or insufficient permissions."
          console.log(e);
          setLoadError("No pudimos cargar las cuentas desde Firestore.");
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (authLoading) return null;

  async function handleUserStatusChange(id: string, status: AccountStatus) {
    await setAccountStatus(id, "consumer", status);
  }
  async function handleUserDelete(id: string) {
    await deleteAccountDocument(id, "consumer");
  }
  async function handleStoreStatusChange(id: string, status: AccountStatus) {
    await setAccountStatus(id, "store", status);
  }
  async function handleStoreDelete(id: string) {
    await deleteAccountDocument(id, "store");
  }
  async function handleProductStatusChange(id: string, status: ProductStatus) {
    await updateProductoEstado(id, status);
  }
  async function handleProductDelete(id: string) {
    await deleteProducto(id);
  }

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
