import { useMemo, useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import CreationDateFilter from "./CreationDateFilter";
import { formatRelative, getInitials } from "../../utils/adminFormatters";
import {
  countAdminStatuses,
  filterAdminItems,
  paginateAdminItems,
} from "../../utils/adminPanelData";
import type { AccountStatus, ManagedAccount } from "../../ports/accountRepository";
import {
  matchesCreationDateRange,
  type CreationDateRange,
} from "../../utils/adminDateFilter";

export type { AccountStatus, ManagedAccount } from "../../ports/accountRepository";

const STATUSES: AccountStatus[] = ["activa", "suspendida", "pendiente"];
const STATUS_LABELS: Record<AccountStatus, string> = {
  activa: "Activa",
  suspendida: "Suspendida",
  pendiente: "Pendiente",
};

const PAGE_SIZE = 8;

type PendingAction = {
  account: ManagedAccount;
  action: "activar" | "suspender" | "eliminar";
};

interface AccountsPanelProps {
  entityLabel: string;
  entityLabelPlural: string;
  initialAccounts: ManagedAccount[];

  onStatusChange: (id: string, status: AccountStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAccountsChange?: (accounts: ManagedAccount[]) => void;
}

export default function AccountsPanel({
  entityLabel,
  entityLabelPlural,
  initialAccounts,
  onStatusChange,
  onDelete,
  onAccountsChange,
}: AccountsPanelProps) {
  const [accounts, setAccounts] = useState<ManagedAccount[]>(initialAccounts);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todas" | AccountStatus>(
    "todas",
  );
  const [creationDateRange, setCreationDateRange] =
    useState<CreationDateRange>("todos");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      filterAdminItems(
        accounts,
        query,
        (account) => [account.displayName, account.email],
        (account) =>
          (statusFilter === "todas" || account.status === statusFilter) &&
          matchesCreationDateRange(account.createdAt, creationDateRange),
      ),
    [accounts, query, statusFilter, creationDateRange],
  );
  const { pageItems, currentPage, totalPages } = paginateAdminItems(
    filtered,
    page,
    PAGE_SIZE,
  );

  const counts = useMemo(
    () =>
      countAdminStatuses(accounts, STATUSES, (account) => account.status),
    [accounts],
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
      let updatedAccounts: ManagedAccount[];
      if (pending.action === "eliminar") {
        await onDelete(pending.account.id);
        updatedAccounts = accounts.filter((a) => a.id !== pending.account.id);
      } else {
        const newStatus: AccountStatus =
          pending.action === "suspender" ? "suspendida" : "activa";
        await onStatusChange(pending.account.id, newStatus);
        updatedAccounts = accounts.map((a) =>
            a.id === pending.account.id ? { ...a, status: newStatus } : a,
        );
      }
      setAccounts(updatedAccounts);
      onAccountsChange?.(updatedAccounts);
      setPending(null);
    } catch (error) {
      console.error("No se pudo completar la acción administrativa sobre la cuenta.", error);
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
            {entityLabel == "consumidor" ? "👥" : "🏪"}
          </span>
          <div>
            <p className="stat-value">{accounts.length}</p>
            <p className="stat-label">Total de {entityLabelPlural}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">
            🟢
          </span>
          <div>
            <p className="stat-value">{counts.get("activa")}</p>
            <p className="stat-label">Activos</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">
            🔴
          </span>
          <div>
            <p className="stat-value">{counts.get("suspendida")}</p>
            <p className="stat-label">Suspendidos</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">
            🕓
          </span>
          <div>
            <p className="stat-value">{counts.get("pendiente")}</p>
            <p className="stat-label">Pendientes</p>
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
              placeholder={`Buscar ${entityLabelPlural} por nombre o correo`}
            />
          </div>
          <div className="toolbar-filters">
            <CreationDateFilter
              value={creationDateRange}
              onChange={(value) => updateFilter(setCreationDateRange)(value)}
            />
            <select
              aria-label={`Filtrar ${entityLabelPlural} por estado`}
              value={statusFilter}
              onChange={(e) =>
                updateFilter(setStatusFilter)(
                  e.target.value as "todas" | AccountStatus,
                )
              }
            >
              <option value="todas">Todos los estados</option>
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
                <th>{entityLabel[0].toUpperCase() + entityLabel.slice(1)}</th>
                <th>Estado</th>
                <th>Creada</th>
                <th className="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="account-cell">
                      <span className="account-avatar" aria-hidden="true">
                        {getInitials(a.displayName)}
                      </span>
                      <div>
                        <p className="account-name">{a.displayName}</p>
                        <p className="account-email">{a.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${a.status}`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                  </td>
                  <td>{a.createdAt ? formatRelative(a.createdAt) : "Sin fecha"}</td>
                  <td>
                    <div className="row-actions">
                      {a.status !== "activa" && (
                        <button
                          type="button"
                          className="icon-btn icon-btn-success"
                          title={`Activar ${entityLabel}`}
                          onClick={() =>
                            setPending({ account: a, action: "activar" })
                          }
                        >
                          ✅
                        </button>
                      )}
                      {a.status !== "suspendida" && (
                        <button
                          type="button"
                          className="icon-btn icon-btn-warning"
                          title={`Suspender ${entityLabel}`}
                          onClick={() =>
                            setPending({ account: a, action: "suspender" })
                          }
                        >
                          ⛔
                        </button>
                      )}
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        title={`Eliminar ${entityLabel}`}
                        onClick={() =>
                          setPending({ account: a, action: "eliminar" })
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
                  <td colSpan={5} className="table-empty">
                    No hay {entityLabelPlural} que coincidan con los filtros.
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
            pending.action === "suspender"
              ? `Suspender ${entityLabel}`
              : pending.action === "activar"
                ? `Activar ${entityLabel}`
                : `Eliminar ${entityLabel}`
          }
          message={
            pending.action === "suspender"
              ? `${pending.account.displayName} perderá acceso de inmediato. Podrás reactivarlo cuando quieras.`
              : pending.action === "activar"
                ? `${pending.account.displayName} recuperará el acceso normal a la plataforma.`
                : `Esta acción es permanente. Se eliminarán los datos de ${pending.account.displayName}.`
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
