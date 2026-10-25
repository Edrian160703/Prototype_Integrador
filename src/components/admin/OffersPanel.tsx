import { useMemo, useState } from "react";
import { formatCurrency } from "../../utils/adminFormatters";
import {
  filterAdminItems,
  paginateAdminItems,
} from "../../utils/adminPanelData";
import type { OfertaConComercio } from "../../types/oferta";

type OfferStatus = "vigente" | "vencida" | "agotada";
type OfferStatusFilter = "todos" | OfferStatus;

const STATUS_LABELS: Record<OfferStatus, string> = {
  vigente: "Vigente",
  vencida: "Vencida",
  agotada: "Agotada",
};

const STATUS_CLASSES: Record<OfferStatus, string> = {
  vigente: "status-activa",
  vencida: "status-suspendida",
  agotada: "status-pendiente",
};

const PAGE_SIZE = 8;

function getOfferStatus(offer: OfertaConComercio, now: number): OfferStatus {
  if (offer.data.cantidad_disponible <= 0) return "agotada";
  if (offer.data.fecha_limite.getTime() <= now) return "vencida";
  return "vigente";
}

function formatDate(value: Date): string {
  return value.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OffersPanel({ offers }: { offers: OfertaConComercio[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OfferStatusFilter>("todos");
  const [storeFilter, setStoreFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const now = Date.now();

  const stores = useMemo(
    () =>
      Array.from(
        new Set(offers.map((offer) => offer.comercio?.businessName || "Comercio FoodBack")),
      ).sort(),
    [offers],
  );

  const filtered = useMemo(
    () =>
      filterAdminItems(
        offers,
        query,
        (offer) => [
          offer.data.nombre_producto,
          offer.comercio?.businessName || "Comercio FoodBack",
        ],
        (offer) =>
          (statusFilter === "todos" || getOfferStatus(offer, now) === statusFilter) &&
          (storeFilter === "todos" ||
            (offer.comercio?.businessName || "Comercio FoodBack") === storeFilter),
      ),
    [offers, query, statusFilter, storeFilter, now],
  );

  const { pageItems, currentPage, totalPages } = paginateAdminItems(
    filtered,
    page,
    PAGE_SIZE,
  );

  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const counts = {
    vigente: offers.filter((offer) => getOfferStatus(offer, now) === "vigente").length,
    vencida: offers.filter((offer) => getOfferStatus(offer, now) === "vencida").length,
    agotada: offers.filter((offer) => getOfferStatus(offer, now) === "agotada").length,
  };

  return (
    <div className="admin-panel-wrap">
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">🏷️</span>
          <div>
            <p className="stat-value">{offers.length}</p>
            <p className="stat-label">Total de ofertas</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">🟢</span>
          <div>
            <p className="stat-value">{counts.vigente}</p>
            <p className="stat-label">Vigentes</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">🕓</span>
          <div>
            <p className="stat-value">{counts.vencida}</p>
            <p className="stat-label">Vencidas</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">🔴</span>
          <div>
            <p className="stat-value">{counts.agotada}</p>
            <p className="stat-label">Agotadas</p>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <div className="search-field">
            <span aria-hidden="true">🔍</span>
            <input
              aria-label="Buscar ofertas"
              value={query}
              onChange={(event) => updateFilter(setQuery)(event.target.value)}
              placeholder="Buscar oferta o comercio"
            />
          </div>
          <div className="toolbar-filters">
            <select
              aria-label="Filtrar ofertas por comercio"
              value={storeFilter}
              onChange={(event) => updateFilter(setStoreFilter)(event.target.value)}
            >
              <option value="todos">Todos los comercios</option>
              {stores.map((store) => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
            <select
              aria-label="Filtrar ofertas por estado"
              value={statusFilter}
              onChange={(event) =>
                updateFilter(setStatusFilter)(event.target.value as OfferStatusFilter)
              }
            >
              <option value="todos">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Oferta</th>
                <th>Comercio</th>
                <th>Precio</th>
                <th>Disponibles</th>
                <th>Vence</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((offer) => {
                const status = getOfferStatus(offer, now);
                return (
                  <tr key={offer.id}>
                    <td>
                      <p className="account-name">{offer.data.nombre_producto}</p>
                      <p className="account-email">{offer.data.id_categoria}</p>
                    </td>
                    <td>{offer.comercio?.businessName || "Comercio FoodBack"}</td>
                    <td>
                      <p className="account-name">{formatCurrency(offer.data.precio_oferta)}</p>
                      {offer.data.precio_original !== offer.data.precio_oferta && (
                        <p className="account-email">{formatCurrency(offer.data.precio_original)}</p>
                      )}
                    </td>
                    <td>{offer.data.cantidad_disponible}</td>
                    <td>{formatDate(offer.data.fecha_limite)}</td>
                    <td>
                      <span className={`status-badge ${STATUS_CLASSES[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No hay ofertas que coincidan con los filtros.
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
    </div>
  );
}
