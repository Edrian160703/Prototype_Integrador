import { useEffect, useMemo, useState } from "react";
import useAdminDashboard from "../../hooks/useAdminDashboard";
import type { ManagedAccount } from "../../ports/accountRepository";
import type { OfertaConComercio } from "../../types/oferta";
import type { EstadoReserva, ReservaDocument } from "../../types/reserva";
import ConfirmDialog from "./ConfirmDialog";

const TABLE_HEADERS = [
  "Reserva",
  "Consumidor",
  "Comercio",
  "Producto",
  "Fecha",
  "Cantidad",
  "Estado",
  "Acciones",
];

type ReservationAction = {
  id: string;
  status: Extract<EstadoReserva, "confirmada" | "cancelada">;
};

export default function GestionReservas() {
  const { users, stores, offers, reservations, handleReservationStatusChange } =
    useAdminDashboard();
  const [snapshot, setSnapshot] = useState<{
    users: ManagedAccount[] | null;
    stores: ManagedAccount[] | null;
    offers: OfertaConComercio[] | null;
    reservations: ReservaDocument[] | null;
  }>({
    users: null,
    stores: null,
    offers: null,
    reservations: null,
  });
  const [pendingAction, setPendingAction] = useState<ReservationAction | null>(
    null,
  );
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setSnapshot({ users, stores, offers, reservations });
  }, [users, stores, offers, reservations]);

  const reservationRows = useMemo(() => {
    if (
      snapshot.users === null ||
      snapshot.stores === null ||
      snapshot.offers === null ||
      snapshot.reservations === null
    ) {
      return null;
    }

    return snapshot.reservations.map((reservation) => {
      const offer = snapshot.offers?.find(
        (item) =>
          item.id === reservation.id_producto ||
          item.data.id_producto ===
            (reservation.id_producto_catalogo ?? reservation.id_producto),
      );
      const consumer = snapshot.users?.find(
        (item) => item.id === reservation.id_usuario,
      );
      const store = offer
        ? snapshot.stores?.find((item) => item.id === offer.data.id_comercio)
        : undefined;

      return { reservation, consumer, offer, store };
    });
  }, [snapshot]);

  async function confirmReservationAction() {
    if (!pendingAction) return;

    setStatusUpdating(true);
    setActionError(null);
    try {
      await handleReservationStatusChange(
        pendingAction.id,
        pendingAction.status,
      );
      setSnapshot((current) => ({
        ...current,
        reservations:
          current.reservations?.map((reservation) =>
            reservation.id_reserva === pendingAction.id
              ? { ...reservation, estado_reserva: pendingAction.status }
              : reservation,
          ) ?? null,
      }));
      setPendingAction(null);
    } catch (error) {
      console.error("No se pudo actualizar el estado de la reserva.", error);
      setActionError("No pudimos actualizar la reserva. Inténtalo de nuevo.");
    } finally {
      setStatusUpdating(false);
    }
  }

  return (
    <>
      <table className="tabla-main">
        <thead>
          <tr>
            {TABLE_HEADERS.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reservationRows === null ? (
            <tr>
              <td colSpan={TABLE_HEADERS.length}>Cargando reservas…</td>
            </tr>
          ) : reservationRows.length === 0 ? (
            <tr>
              <td colSpan={TABLE_HEADERS.length}>
                No hay reservas registradas.
              </td>
            </tr>
          ) : (
            reservationRows.map(({ reservation, consumer, offer, store }) => (
              <tr key={reservation.id_reserva}>
                <td>{reservation.id_reserva}</td>
                <td>
                  {consumer
                    ? `${consumer.displayName} (${consumer.email})`
                    : reservation.email_usuario}
                </td>
                <td>{store?.displayName ?? "Comercio no disponible"}</td>
                <td>{offer?.data.nombre_producto ?? "Oferta no disponible"}</td>
                <td>{reservation.fecha_reserva.toLocaleString("es-PE")}</td>
                <td>{reservation.cantidad}</td>
                <td>{reservation.estado_reserva}</td>
                <td className="actions-cell">
                  {reservation.estado_reserva === "pendiente" && (
                    <button
                      type="button"
                      className="gestion-table-button gestion-table-button-success"
                      onClick={() => {
                        setActionError(null);
                        setPendingAction({
                          id: reservation.id_reserva,
                          status: "confirmada",
                        });
                      }}
                    >
                      Confirmar
                    </button>
                  )}
                  {reservation.estado_reserva !== "cancelada" &&
                    reservation.estado_reserva !== "vencida" && (
                      <button
                        type="button"
                        className="gestion-table-button gestion-table-button-dangerous"
                        onClick={() => {
                          setActionError(null);
                          setPendingAction({
                            id: reservation.id_reserva,
                            status: "cancelada",
                          });
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pendingAction && (
        <ConfirmDialog
          title={
            pendingAction.status === "confirmada"
              ? "Confirmar reserva"
              : "Cancelar reserva"
          }
          message={
            pendingAction.status === "confirmada"
              ? "¿Deseas confirmar esta reserva?"
              : "¿Deseas cancelar esta reserva? Las unidades reservadas volverán al inventario."
          }
          confirmLabel={
            pendingAction.status === "confirmada" ? "Confirmar" : "Cancelar"
          }
          variant={pendingAction.status === "cancelada" ? "danger" : "primary"}
          loading={statusUpdating}
          onCancel={() => {
            setPendingAction(null);
            setActionError(null);
          }}
          onConfirm={confirmReservationAction}
        />
      )}
      {actionError && <p className="error">{actionError}</p>}
    </>
  );
}
