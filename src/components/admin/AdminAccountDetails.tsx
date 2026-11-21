import { useEffect } from "react";
import ReactDOM from "react-dom";
import type { ManagedAccount } from "../../ports/accountRepository";
import type { ProductoAdminItem } from "../../types/productoAdmin";
import type { OfertaConComercio } from "../../types/oferta";
import type { ReservaDocument } from "../../types/reserva";

interface AdminAccountDetailsProps {
  account: ManagedAccount;
  products: ProductoAdminItem[] | null;
  offers: OfertaConComercio[] | null;
  reservations: ReservaDocument[] | null;
  onClose: () => void;
}

const currency = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-PE");
}

export default function AdminAccountDetails({
  account,
  products,
  offers,
  reservations,
  onClose,
}: AdminAccountDetailsProps) {
  const isStore = account.role === "store";
  const storeProducts = isStore
    ? products?.filter((product) => product.storeId === account.id) ?? null
    : [];
  const storeOffers = isStore
    ? offers?.filter((offer) => offer.data.id_comercio === account.id) ?? null
    : [];
  const userReservations = !isStore
    ? (reservations
        ?.filter((reservation) => reservation.id_usuario === account.id)
        .sort(
          (left, right) =>
            right.fecha_reserva.getTime() - left.fecha_reserva.getTime(),
        ) ?? null)
    : [];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const accountInfo = [
    ["Correo", account.email],
    ...(isStore
      ? [
          ["RUC", account.ruc],
          ["Teléfono", account.phone],
          ["Dirección", account.address],
        ]
      : [
          ["DNI", account.dni],
          ["Teléfono", account.phone],
        ]),
    ["Estado", account.status],
    ["Registro", formatDate(account.createdAt)],
  ] as const;

  function getReservationProductName(reservation: ReservaDocument): string {
    const offer = offers?.find(
      (item) =>
        item.id === reservation.id_producto ||
        item.data.id_producto === reservation.id_producto,
    );
    const product = products?.find(
      (item) =>
        item.id === reservation.id_producto_catalogo ||
        item.id === reservation.id_producto,
    );

    return (
      offer?.data.nombre_producto ??
      product?.name ??
      `Producto ${reservation.id_producto}`
    );
  }

  const root = document.getElementById("root") ?? document.body;

  return ReactDOM.createPortal(
    <div
      className="admin-account-detail-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-account-detail-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="admin-account-detail">
        <div className="admin-account-detail-header">
          <div>
            <p className="admin-account-detail-kicker">
              {isStore ? "Información del comercio" : "Información del consumidor"}
            </p>
            <h2 id="admin-account-detail-title">
              {account.displayName || account.email}
            </h2>
          </div>
          <button
            type="button"
            className="admin-account-detail-close"
            onClick={onClose}
            aria-label="Cerrar información"
          >
            ×
          </button>
        </div>

        <div className="admin-account-detail-content">
          <section className="admin-account-detail-section">
            <h3>Información general</h3>
            <dl className="admin-account-detail-info">
              {accountInfo.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "No registrado"}</dd>
                </div>
              ))}
            </dl>
          </section>

          {isStore ? (
            <>
              <section className="admin-account-detail-section">
                <h3>Productos del catálogo</h3>
                {storeProducts === null ? (
                  <p className="admin-account-detail-empty">Cargando productos…</p>
                ) : storeProducts.length === 0 ? (
                  <p className="admin-account-detail-empty">
                    Este comercio no tiene productos en el catálogo.
                  </p>
                ) : (
                  <div className="admin-account-detail-list">
                    {storeProducts.map((product) => (
                      <article
                        className="admin-account-detail-item"
                        key={product.id}
                      >
                        <div>
                          <h4>{product.name}</h4>
                          <p>{product.category} · Stock: {product.stock}</p>
                        </div>
                        <strong>{currency.format(product.price)}</strong>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="admin-account-detail-section">
                <h3>Ofertas publicadas</h3>
                {storeOffers === null ? (
                  <p className="admin-account-detail-empty">Cargando ofertas…</p>
                ) : storeOffers.length === 0 ? (
                  <p className="admin-account-detail-empty">
                    Este comercio no tiene ofertas publicadas.
                  </p>
                ) : (
                  <div className="admin-account-detail-list">
                    {storeOffers.map((offer) => (
                      <article
                        className="admin-account-detail-item"
                        key={offer.id}
                      >
                        <div>
                          <h4>{offer.data.nombre_producto}</h4>
                          <p>
                            {offer.data.estado} · Vence{" "}
                            {formatDate(offer.data.fecha_limite)}
                          </p>
                        </div>
                        <strong>{currency.format(offer.data.precio_oferta)}</strong>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="admin-account-detail-section">
              <h3>Pedidos y reservas ({userReservations?.length ?? "…" })</h3>
              {userReservations === null ? (
                <p className="admin-account-detail-empty">Cargando reservas…</p>
              ) : userReservations.length === 0 ? (
                <p className="admin-account-detail-empty">
                  Este consumidor no tiene pedidos ni reservas.
                </p>
              ) : (
                <div className="admin-account-detail-list">
                  {userReservations.map((reservation) => (
                    <article
                      className="admin-account-detail-item"
                      key={reservation.id_reserva}
                    >
                      <div>
                        <h4>{getReservationProductName(reservation)}</h4>
                        <p>
                          {formatDate(reservation.fecha_reserva)} · Cantidad:{" "}
                          {reservation.cantidad}
                        </p>
                        <small>Reserva {reservation.id_reserva}</small>
                      </div>
                      <span
                        className={`admin-account-detail-status admin-account-detail-status-${reservation.estado_reserva}`}
                      >
                        {reservation.estado_reserva}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </div>,
    root,
  );
}
