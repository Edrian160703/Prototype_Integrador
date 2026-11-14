import { useMemo } from "react";
import useAdminDashboard from "../../hooks/useAdminDashboard";

export default function GestionOfertas() {
  const { offers } = useAdminDashboard();
  const visibleOffers = useMemo(
    () => offers?.filter((offer) => offer.data.estado !== "eliminada") ?? null,
    [offers],
  );

  return (
    <div className="gestion-upper">
      <table className="tabla-main">
        <thead>
          <tr>
            <th>ID</th>
            <th>Producto</th>
            <th>Comercio</th>
            <th>Precio de oferta</th>
            <th>Cantidad disponible</th>
            <th>Fecha límite</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {visibleOffers === null ? (
            <tr>
              <td colSpan={7}>Cargando ofertas…</td>
            </tr>
          ) : visibleOffers.length === 0 ? (
            <tr>
              <td colSpan={7}>No hay ofertas disponibles para gestionar.</td>
            </tr>
          ) : (
            visibleOffers.map((offer) => (
              <tr key={offer.id}>
                <td>{offer.id}</td>
                <td>{offer.data.nombre_producto}</td>
                <td>{offer.comercio?.businessName ?? "Sin comercio"}</td>
                <td>
                  {offer.data.precio_oferta.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </td>
                <td>{offer.data.cantidad_disponible}</td>
                <td>{offer.data.fecha_limite.toLocaleString("es-PE")}</td>
                <td className="static-cell">
                  {/* ESTADO */}
                  <div
                    title={
                      offer.data.estado.charAt(0).toUpperCase() +
                      offer.data.estado.slice(1)
                    }
                    className={`cell-status cell-status-${offer.data.estado}`}
                  ></div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
