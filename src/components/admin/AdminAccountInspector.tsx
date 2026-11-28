import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ManagedAccount } from "../../ports/accountRepository";
import type { OfertaConComercio } from "../../types/oferta";
import type { ProductoAdminItem } from "../../types/productoAdmin";
import type { ReservaDocument } from "../../types/reserva";
import { formatCurrency } from "../../utils/adminFormatters";

interface AdminAccountInspectorProps {
  account: ManagedAccount;
  products: ProductoAdminItem[] | null;
  offers: OfertaConComercio[] | null;
  reservations: ReservaDocument[] | null;
  onClose: () => void;
}

function formatDate(date: Date | null): string {
  return date
    ? date.toLocaleDateString("es-PE")
    : "Sin fecha";
}

export default function AdminAccountInspector({
  account,
  products,
  offers,
  reservations,
  onClose,
}: AdminAccountInspectorProps) {
  const isStore = account.role === "store";
  const accountUid = account.uid ?? account.id;
  const accountOffers = isStore
    ? offers?.filter((offer) => offer.data.id_comercio === accountUid) ?? null
    : [];
  const accountReservations = !isStore
    ? reservations
        ?.filter((reservation) => reservation.id_usuario === accountUid)
        .sort(
          (left, right) =>
            right.fecha_reserva.getTime() - left.fecha_reserva.getTime(),
        ) ?? null
    : [];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
    return offer?.data.nombre_producto ?? product?.name ?? reservation.id_producto;
  }

  const portalRoot = document.getElementById("root") ?? document.body;

  return createPortal(
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
        <header className="admin-account-detail-header">
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
        </header>

        <div className="admin-account-detail-content">
          <section className="admin-account-detail-section">
            <h3>Información general</h3>
            <dl className="admin-account-detail-info">
              <div><dt>Correo</dt><dd>{account.email || "No registrado"}</dd></div>
              <div><dt>Tipo de cuenta</dt><dd>{isStore ? "Comercio" : "Consumidor"}</dd></div>
              {isStore ? (
                <>
                  <div><dt>RUC</dt><dd>{account.ruc || "No registrado"}</dd></div>
                  <div><dt>Teléfono</dt><dd>{account.phone || "No registrado"}</dd></div>
                  <div><dt>Dirección</dt><dd>{account.address || "No registrada"}</dd></div>
                </>
              ) : (
                <>
                  <div><dt>DNI</dt><dd>{account.dni || "No registrado"}</dd></div>
                  <div><dt>Teléfono</dt><dd>{account.phone || "No registrado"}</dd></div>
                </>
              )}
              <div><dt>Estado</dt><dd>{account.status}</dd></div>
              <div><dt>Registro</dt><dd>{formatDate(account.createdAt)}</dd></div>
              <div><dt>Última actividad</dt><dd>{formatDate(account.lastActiveAt)}</dd></div>
            </dl>
          </section>

          {isStore ? (
            <section className="admin-account-detail-section">
              <h3>Ofertas publicadas</h3>
              {accountOffers === null ? (
                <p className="admin-account-detail-empty">Cargando ofertas…</p>
              ) : accountOffers.length === 0 ? (
                <p className="admin-account-detail-empty">
                  Este comercio no tiene ofertas publicadas.
                </p>
              ) : (
                <div className="admin-account-detail-list">
                  {accountOffers.map((offer) => (
                    <article
                      className="admin-account-detail-item admin-account-detail-offer"
                      key={offer.id}
                    >
                      {offer.data.imagen_url ? (
                        <img
                          className="admin-account-detail-offer-image"
                          src={offer.data.imagen_url}
                          alt={`Imagen de ${offer.data.nombre_producto}`}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="admin-account-detail-offer-image admin-account-detail-offer-no-image"
                          role="img"
                          aria-label={`Sin imagen para ${offer.data.nombre_producto}`}
                        >
                          Sin imagen
                        </div>
                      )}
                      <div className="admin-account-detail-offer-content">
                        <div className="admin-account-detail-offer-heading">
                          <h4>{offer.data.nombre_producto}</h4>
                          <span
                            className={`admin-account-detail-status admin-account-detail-status-${offer.data.estado}`}
                          >
                            {offer.data.estado}
                          </span>
                        </div>
                        {offer.data.descripcion && (
                          <p className="admin-account-detail-offer-description">
                            {offer.data.descripcion}
                          </p>
                        )}
                        <dl className="admin-account-detail-offer-info">
                          <div>
                            <dt>Precio de oferta</dt>
                            <dd>{formatCurrency(offer.data.precio_oferta)}</dd>
                          </div>
                          <div>
                            <dt>Precio original</dt>
                            <dd>{formatCurrency(offer.data.precio_original)}</dd>
                          </div>
                          <div>
                            <dt>Disponibles</dt>
                            <dd>{offer.data.cantidad_disponible}</dd>
                          </div>
                          <div>
                            <dt>Categoría</dt>
                            <dd>{offer.data.id_categoria || "Sin categoría"}</dd>
                          </div>
                          <div>
                            <dt>Vence</dt>
                            <dd>{formatDate(offer.data.fecha_limite)}</dd>
                          </div>
                          <div>
                            <dt>Recojo</dt>
                            <dd>{offer.data.horario_recojo || "No indicado"}</dd>
                          </div>
                        </dl>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="admin-account-detail-section">
              <h3>Reservas ({accountReservations?.length ?? "…"})</h3>
              {accountReservations === null ? (
                <p className="admin-account-detail-empty">Cargando reservas…</p>
              ) : accountReservations.length === 0 ? (
                <p className="admin-account-detail-empty">
                  Este consumidor no tiene reservas registradas.
                </p>
              ) : (
                <div className="admin-account-detail-list">
                  {accountReservations.map((reservation) => (
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
    portalRoot,
  );
}
