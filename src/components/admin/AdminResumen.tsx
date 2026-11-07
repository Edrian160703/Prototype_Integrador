import { useEffect, useState } from "react";
import useAdminDashboard from "../../hooks/useAdminDashboard";
import type { ManagedAccount } from "../../ports/accountRepository";
import { ProductoAdminItem } from "../../types/productoAdmin";
import { ReservaDocument } from "../../application/reservas";
import { OfertaConComercio } from "../../application/contracts";

import "./../../styles/admin/admin-resumen.css"


export default function AdminResumen() {
  const {
    users,
    stores,
    products,
    reservations,
    offers,
  } = useAdminDashboard();
  
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
          <span className="stat-icon" aria-hidden="true">👤</span>
          <div className="stat-body">
            <p className="stat-value">
              {snapshot.users === null
                ? "…"
                : snapshot.users.filter((account) => account.status === "activa").length}
            </p>
            <p className="stat-label">Consumidores activos</p>
          </div>
        </div>

        <div className="stat-card stat-card-comerce">
          <span className="stat-icon" aria-hidden="true">🏪</span>
          <div className="stat-body">
            <p className="stat-value">
              {snapshot.stores === null
                ? "…"
                : snapshot.stores.filter((account) => account.status === "activa").length}
            </p>
            <p className="stat-label">Comercios activos</p>
          </div>
        </div>

        <div className="stat-card stat-card-product">
          <span className="stat-icon" aria-hidden="true">📦</span>
          <div className="stat-body">
            <p className="stat-value">
              {snapshot.offers === null
                ? "…"
                : snapshot.offers.filter((offer) => offer.data.estado === 'disponible').length}
            </p>
            <p className="stat-label">Ofertas disponibles</p>
          </div>
        </div>

        <div className="stat-card stat-card-reservation">
          <span className="stat-icon" aria-hidden="true">🕓</span>
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
              {snapshot.offers === null
                ? (
                  <tr>
                    <td className="empty-state">…</td>
                  </tr>
                )
                : snapshot.offers.map((offer) => (
                  <tr key={offer.id}>
                    <td className="product-name">{offer.data.nombre_producto}</td>
                    <td className={`status-badge status-${offer.data.estado}`}>
                      {offer.data.estado}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="new-card new-card-consumer">
          <div className="card-header">
            <h2>Consumidores nuevos</h2>
          </div>
          <table>
            <tbody>
              {snapshot.users === null
                ? (
                  <tr>
                    <td className="empty-state">…</td>
                  </tr>
                )
                : snapshot.users.map((user) => (
                  <tr key={user.id}>
                    <td className="user-email">{user.email}</td>
                    <td className="user-name">{user.displayName}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="new-card new-card-comerce">
          <div className="card-header">
            <h2>Comercios nuevos</h2>
          </div>
          <table>
            <tbody>
              {snapshot.stores === null
                ? (
                  <tr>
                    <td className="empty-state">…</td>
                  </tr>
                )
                : snapshot.stores.map((store) => (
                  <tr key={store.id}>
                    <td className="store-email">{store.email}</td>
                    <td className="store-name">{store.displayName}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}