import { useMemo, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { formatCurrency, formatRelative } from "../../utils/adminFormatters";

export type ProductStatus = "activo" | "pausado" | "agotado";

export interface Product {
  id: string;
  name: string;
  category: string;
  storeName: string;
  price: number;
  stock: number;
  status: ProductStatus;
  updatedAt: Date;
}

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
  product: Product;
  action: "activar" | "pausar" | "eliminar";
};

interface ProductsPanelProps {
  initialProducts: Product[];
  onStatusChange?: (id: string, status: ProductStatus) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function ProductsPanel({
  initialProducts,
  onStatusChange,
  onDelete,
}: ProductsPanelProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | ProductStatus>(
    "todos",
  );
  const [storeFilter, setStoreFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [loading, setLoading] = useState(false);

  const stores = useMemo(
    () => Array.from(new Set(products.map((p) => p.storeName))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.storeName.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "todos" || p.status === statusFilter;
      const matchesStore =
        storeFilter === "todos" || p.storeName === storeFilter;
      return matchesQuery && matchesStatus && matchesStore;
    });
  }, [products, query, statusFilter, storeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(
    () => ({
      total: products.length,
      activos: products.filter((p) => p.status === "activo").length,
      pausados: products.filter((p) => p.status === "pausado").length,
      agotados: products.filter((p) => p.status === "agotado").length,
    }),
    [products],
  );

  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  async function applyAction() {
    if (!pending) return;
    setLoading(true);
    try {
      if (pending.action === "eliminar") {
        await onDelete?.(pending.product.id);
        setProducts((prev) => prev.filter((p) => p.id !== pending.product.id));
      } else {
        const newStatus: ProductStatus =
          pending.action === "pausar" ? "pausado" : "activo";
        await onStatusChange?.(pending.product.id, newStatus);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === pending.product.id ? { ...p, status: newStatus } : p,
          ),
        );
      }
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
            <p className="stat-value">{counts.total}</p>
            <p className="stat-label">Total de productos</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">
            🟢
          </span>
          <div>
            <p className="stat-value">{counts.activos}</p>
            <p className="stat-label">Activos</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">
            🕓
          </span>
          <div>
            <p className="stat-value">{counts.pausados}</p>
            <p className="stat-label">Pausados</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">
            🔴
          </span>
          <div>
            <p className="stat-value">{counts.agotados}</p>
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
            <select
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
                      {p.category} · actualizado {formatRelative(p.updatedAt)}
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
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        title="Eliminar producto"
                        onClick={() =>
                          setPending({ product: p, action: "eliminar" })
                        }
                      >
                        🗑️
                      </button>
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
            Mostrando {pageItems.length ? (page - 1) * PAGE_SIZE + 1 : 0}–
            {(page - 1) * PAGE_SIZE + pageItems.length} de {filtered.length}
          </p>
          <div className="pagination-controls">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
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
