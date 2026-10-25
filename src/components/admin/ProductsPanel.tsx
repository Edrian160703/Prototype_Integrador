import { useMemo, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import CreationDateFilter from "./CreationDateFilter";
import { formatCurrency, formatRelative } from "../../utils/adminFormatters";
import type { ProductoEstado } from "../../types/producto";
import type { ProductoAdminItem } from "../../types/productoAdmin";
import {
  countAdminStatuses,
  filterAdminItems,
  paginateAdminItems,
} from "../../utils/adminPanelData";
import {
  matchesCreationDateRange,
  type CreationDateRange,
} from "../../utils/adminDateFilter";

type ProductStatus = ProductoEstado;

const STATUSES: ProductStatus[] = ["activo", "pausado", "agotado"];
const STATUS_LABELS: Record<ProductStatus, string> = {
  activo: "Activo",
  pausado: "Pausado",
  agotado: "Agotado",
};

const STATUS_CLASS: Record<ProductStatus, string> = {
  activo: "status-activa",
  pausado: "status-pendiente",
  agotado: "status-suspendida",
};

const PAGE_SIZE = 8;

type PendingAction = {
  product: ProductoAdminItem;
  action: "activar" | "pausar" | "eliminar";
};

interface ProductsPanelProps {
  initialProducts: ProductoAdminItem[];
  onStatusChange: (id: string, status: ProductStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onProductsChange?: (products: ProductoAdminItem[]) => void;
}

export default function ProductsPanel({
  initialProducts,
  onStatusChange,
  onDelete,
  onProductsChange,
}: ProductsPanelProps) {
  const [products, setProducts] = useState<ProductoAdminItem[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | ProductStatus>(
    "todos",
  );
  const [storeFilter, setStoreFilter] = useState("todos");
  const [creationDateRange, setCreationDateRange] =
    useState<CreationDateRange>("todos");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const stores = useMemo(
    () => Array.from(new Set(products.map((p) => p.storeName))).sort(),
    [products],
  );

  const filtered = useMemo(
    () =>
      filterAdminItems(
        products,
        query,
        (product) => [product.name, product.storeName],
        (product) =>
          (statusFilter === "todos" || product.status === statusFilter) &&
          (storeFilter === "todos" || product.storeName === storeFilter) &&
          matchesCreationDateRange(product.createdAt, creationDateRange),
      ),
    [products, query, statusFilter, storeFilter, creationDateRange],
  );
  const { pageItems, currentPage, totalPages } = paginateAdminItems(
    filtered,
    page,
    PAGE_SIZE,
  );

  const counts = useMemo(
    () => countAdminStatuses(products, STATUSES, (product) => product.status),
    [products],
  );

  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
      setActionError(null);
    };
  }

  async function applyAction() {
    if (!pending) return;
    setLoading(true);
    setActionError(null);
    try {
      let updatedProducts: ProductoAdminItem[];
      if (pending.action === "eliminar") {
        await onDelete(pending.product.id);
        updatedProducts = products.filter((p) => p.id !== pending.product.id);
      } else {
        const newStatus: ProductStatus =
          pending.action === "pausar" ? "pausado" : "activo";
        await onStatusChange(pending.product.id, newStatus);
        updatedProducts = products.map((p) =>
            p.id === pending.product.id ? { ...p, status: newStatus } : p,
        );
      }
      setProducts(updatedProducts);
      onProductsChange?.(updatedProducts);
      setPending(null);
    } catch (error) {
      console.error("No se pudo completar la acción administrativa sobre el producto.", error);
      setActionError("No se pudo completar la acción. Verifica tus permisos e inténtalo de nuevo.");
      setPending(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-panel-wrap">
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">
            📦
          </span>
          <div>
            <p className="stat-value">{products.length}</p>
            <p className="stat-label">Total de productos</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">
            🟢
          </span>
          <div>
            <p className="stat-value">{counts.get("activo")}</p>
            <p className="stat-label">Activos</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">
            🕓
          </span>
          <div>
            <p className="stat-value">{counts.get("pausado")}</p>
            <p className="stat-label">Pausados</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">
            🔴
          </span>
          <div>
            <p className="stat-value">{counts.get("agotado")}</p>
            <p className="stat-label">Agotados</p>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <div className="search-field">
            <span aria-hidden="true">🔍</span>
            <input
              value={query}
              onChange={(e) => updateFilter(setQuery)(e.target.value)}
              placeholder="Buscar producto o comercio"
            />
          </div>
          <div className="toolbar-filters">
            <CreationDateFilter
              value={creationDateRange}
              onChange={(value) => updateFilter(setCreationDateRange)(value)}
            />
            <select
              aria-label="Filtrar productos por comercio"
              value={storeFilter}
              onChange={(e) => updateFilter(setStoreFilter)(e.target.value)}
            >
              <option value="todos">Todos los comercios</option>
              {stores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar productos por estado"
              value={statusFilter}
              onChange={(e) =>
                updateFilter(setStatusFilter)(
                  e.target.value as "todos" | ProductStatus,
                )
              }
            >
              <option value="todos">Todos los estados</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {actionError && (
          <div className="admin-error-banner" role="alert">
            {actionError}
          </div>
        )}

        <div className="table-wrap">
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Comercio</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th className="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p className="account-name">{p.name}</p>
                    <p className="account-email">
                      {p.category} · creado {formatRelative(p.createdAt)}
                    </p>
                  </td>
                  <td>{p.storeName}</td>
                  <td>{formatCurrency(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className={`status-badge ${STATUS_CLASS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      {p.status !== "activo" && (
                        <button
                          type="button"
                          className="icon-btn icon-btn-success"
                          title="Activar producto"
                          onClick={() =>
                            setPending({ product: p, action: "activar" })
                          }
                        >
                          ✅
                        </button>
                      )}
                      {p.status !== "pausado" && (
                        <button
                          type="button"
                          className="icon-btn icon-btn-warning"
                          title="Pausar producto"
                          onClick={() =>
                            setPending({ product: p, action: "pausar" })
                          }
                        >
                          ⏸️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No hay productos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <p>
            Mostrando {pageItems.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
            {(currentPage - 1) * PAGE_SIZE + pageItems.length} de {filtered.length}
          </p>
          <div className="pagination-controls">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {pending && (
        <ConfirmDialog
          title={
            pending.action === "pausar"
              ? "Pausar producto"
              : pending.action === "activar"
                ? "Activar producto"
                : "Eliminar producto"
          }
          message={
            pending.action === "pausar"
              ? `${pending.product.name} dejará de mostrarse a los usuarios hasta que lo reactives.`
              : pending.action === "activar"
                ? `${pending.product.name} volverá a estar visible para los usuarios.`
                : `Esta acción es permanente. Se eliminará "${pending.product.name}" del catálogo.`
          }
          confirmLabel="Confirmar"
          variant={pending.action === "eliminar" ? "danger" : "primary"}
          loading={loading}
          onCancel={() => setPending(null)}
          onConfirm={applyAction}
        />
      )}
    </div>
  );
}
