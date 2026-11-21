import { useEffect, useState } from "react";
import useAdminDashboard from "../../hooks/useAdminDashboard";
import type { ManagedAccount } from "../../ports/accountRepository";
import { ProductoAdminItem } from "../../types/productoAdmin";
import { ReservaDocument } from "../../application/reservas";
import { OfertaConComercio } from "../../application/contracts";
import AdminAccountDetails from "./AdminAccountDetails";

export default function AdminResumen() {
  const { users, stores, products, reservations, offers } = useAdminDashboard();
  const [selectedAccount, setSelectedAccount] =
    useState<ManagedAccount | null>(null);

  const [snapshot, setSnapshot] = useState<{
    users: ManagedAccount[] | null;
    stores: ManagedAccount[] | null;
    products: ProductoAdminItem[] | null;
    reservations: ReservaDocument[] | null;
    offers: OfertaConComercio[] | null;
  }>({
    users: null,
    stores: null,
    products: null,
    reservations: null,
    offers: null,
  });

  useEffect(() => {
    setSnapshot({ users, stores, products, reservations, offers });
  }, [users, stores, products, reservations, offers]);

  return (
    <>
      <div className="admin-stats">
        <div className="stat-card stat-card-consumer">
          <span className="stat-icon" aria-hidden="true">
            👤
          </span>
          <div className="stat-body">
            <p className="stat-value">
              {snapshot.users === null
                ? "…"
                : snapshot.users.filter(
                    (account) => account.status === "activa",
                  ).length}
            </p>
            <p className="stat-label">Consumidores activos</p>
          </div>
        </div>

        <div className="stat-card stat-card-comerce">
          <span className="stat-icon" aria-hidden="true">
            🏪
          </span>
          <div className="stat-body">
            <p className="stat-value">
              {snapshot.stores === null
                ? "…"
                : snapshot.stores.filter(
                    (account) => account.status === "activa",
                  ).length}
            </p>
            <p className="stat-label">Comercios activos</p>
          </div>
        </div>

        <div className="stat-card stat-card-product">
          <span className="stat-icon" aria-hidden="true">
            📦
          </span>
          <div className="stat-body">
            <p className="stat-value">
              {snapshot.offers === null
                ? "…"
                : snapshot.offers.filter(
                    (offer) => offer.data.estado === "disponible",
                  ).length}
            </p>
            <p className="stat-label">Ofertas disponibles</p>
          </div>
        </div>

        <div className="stat-card stat-card-reservation">
          <span className="stat-icon" aria-hidden="true">
            🕓
          </span>
          <div className="stat-body">
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

      <div className="new-content">
        <div className="new-card new-card-offers">
          <div className="card-header">
            <h2>Ofertas nuevas publicadas</h2>
          </div>
          <table>
            <tbody>
              {snapshot.offers === null ? (
                <tr>
                  <td className="empty-state">…</td>
                </tr>
              ) : (
                snapshot.offers.map((offer) => (
                  <tr key={offer.id}>
                    <td className="product-name">
                      {offer.data.nombre_producto}
                    </td>
                    <td className={`status-badge status-${offer.data.estado}`}>
                      {offer.data.estado}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="new-card new-card-consumer">
          <div className="card-header">
            <h2>Consumidores nuevos</h2>
          </div>
          {snapshot.users === null ? (
            <p className="empty-state">Cargando consumidores…</p>
          ) : snapshot.users.length === 0 ? (
            <p className="empty-state">No hay consumidores registrados.</p>
          ) : (
            <div className="account-summary-list">
              {snapshot.users.map((user) => (
                <button
                  type="button"
                  className="account-summary-row"
                  key={user.id}
                  onClick={() => setSelectedAccount(user)}
                  aria-label={`Ver información y reservas de ${user.displayName || user.email}`}
                >
                  <span className="account-summary-row-content">
                    <strong>{user.displayName || "Sin nombre"}</strong>
                    <span>{user.email}</span>
                  </span>
                  <span className="account-summary-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="new-card new-card-comerce">
          <div className="card-header">
            <h2>Comercios nuevos</h2>
          </div>
          {snapshot.stores === null ? (
            <p className="empty-state">Cargando comercios…</p>
          ) : snapshot.stores.length === 0 ? (
            <p className="empty-state">No hay comercios registrados.</p>
          ) : (
            <div className="account-summary-list">
              {snapshot.stores.map((store) => (
                <button
                  type="button"
                  className="account-summary-row"
                  key={store.id}
                  onClick={() => setSelectedAccount(store)}
                  aria-label={`Ver información y productos de ${store.displayName || store.email}`}
                >
                  <span className="account-summary-row-content">
                    <strong>{store.displayName || "Sin nombre"}</strong>
                    <span>{store.email}</span>
                  </span>
                  <span className="account-summary-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedAccount && (
        <AdminAccountDetails
          account={selectedAccount}
          products={snapshot.products}
          offers={snapshot.offers}
          reservations={snapshot.reservations}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </>
  );
}
