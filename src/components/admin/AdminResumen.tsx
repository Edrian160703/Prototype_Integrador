import { useEffect, useState } from "react";
import useAdminDashboard from "../../hooks/useAdminDashboard";
import { ManagedAccount } from "./AccountsPanel";
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
  
  return(
    <>
      <div className="admin-stats">
        <div className="stat-card stat-card-consumer">
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
        <div className="stat-card stat-card-comerce">
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
        <div className="stat-card stat-card-product">
          <span className="stat-icon" aria-hidden="true">📦</span>
          <div>
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
      <div className="new-content">
        <div className="new-card new-card-offers">
          <h2>Ofertas nuevas publicadas</h2>
          <table>
            <tbody>
              {snapshot.offers === null
                ? "…"
                : snapshot.offers.map((offer) => (
                  <tr key={offer.id}>
                    <td>{offer.data.nombre_producto}</td>
                    <td>{offer.data.estado}</td>
                  </tr>
                  
                ))
              }

            </tbody>
          </table>
          
        </div>
        <div className="new-card new-card-user">
          <h2>Usuarios nuevos</h2>
          <table>
            <tbody>
              {snapshot.users === null
                ? "…"
                : snapshot.users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.displayName}</td>
                    <td>{user.createdAt.toDateString()}</td>
                  </tr>
                  
                ))
              }

            </tbody>
          </table>

        </div>
      </div>
    </>

  )


}