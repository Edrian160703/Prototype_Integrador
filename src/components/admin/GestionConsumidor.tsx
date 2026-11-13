import { useEffect, useMemo, useState } from "react";
import useAdminDashboard from "../../hooks/useAdminDashboard";
import type { ManagedAccount } from "../../ports/accountRepository";
import type { ReservaDocument } from "../../types/reserva";
import type { ProductoAdminItem } from "../../types/productoAdmin";
import ConfirmDialog from "./ConfirmDialog";

const SECONDARY_TABLE_HEADERS: string[] = [
  "Reserva",
  "Producto",
  "Fecha de Reserva",
  "Cantidad Reservada",
  "Estado de reserva",
];

export default function GestionConsumidor() {
  const { users, products, reservations, handleUserStatusChange } =
    useAdminDashboard();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: "suspend" | "reactivate";
  } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [snapshot, setSnapshot] = useState<{
    users: ManagedAccount[] | null;
    products: ProductoAdminItem[] | null;
    reservations: ReservaDocument[] | null;
  }>({
    users: null,
    products: null,
    reservations: null,
  });

  useEffect(() => {
    setSnapshot({ users, products, reservations });
  }, [users, products, reservations]);

  const selectedReservations = useMemo(() => {
    if (!selectedUser || !snapshot.reservations) return [];
    return snapshot.reservations.filter(
      (reservation) => reservation.id_usuario === selectedUser,
    );
  }, [selectedUser, snapshot.reservations]);

  const selectedUserData = useMemo(() => {
    if (!selectedUser || !snapshot.users) return null;
    return snapshot.users.find((user) => user.id === selectedUser) ?? null;
  }, [selectedUser, snapshot.users]);

  async function confirmUserStatusChange() {
    if (!pendingAction) return;

    setStatusUpdating(true);
    try {
      const nextStatus =
        pendingAction.action === "suspend" ? "suspendida" : "activa";
      await handleUserStatusChange(pendingAction.id, nextStatus);
      setSnapshot((current) => ({
        ...current,
        users:
          current.users?.map((user) =>
            user.id === pendingAction.id
              ? { ...user, status: nextStatus }
              : user,
          ) ?? null,
      }));
    } finally {
      setPendingAction(null);
      setStatusUpdating(false);
    }
  }

  return (
    <>
      <table className="tabla-main">
        <thead>
          <tr>
            <th>ID</th>
            <th>Correo</th>
            <th>DNI</th>
            <th>Teléfono</th>
            <th>Nombre</th>
            <th>Estado</th>
            <th className="centered-cell">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.users === null ? (
            <tr>
              <td colSpan={3}>…</td>
            </tr>
          ) : (
            snapshot.users.map((user) => (
              <tr
                key={user.id}
                className={
                  selectedUser === user.id ? "gestion-row-selected" : ""
                }
              >
                <td className="static-cell">{user.id}</td>
                <td className="static-cell">{user.email}</td>
                <td className="static-cell">{user.dni}</td>
                <td className="static-cell">{user.phone}</td>
                <td className="static-cell">{user.displayName}</td>
                <td className="static-cell">
                  <div
                    title={
                      user.status.charAt(0).toUpperCase() + user.status.slice(1)
                    }
                    className={`cell-status cell-status-${user.status}`}
                  ></div>
                </td>
                <td className="static-cell actions-cell">
                  {/* BOTONES DE ACCION PARA EL ADMIN */}

                  <button
                    type="button"
                    className={`gestion-table-button ${selectedUser === user.id ? "gestion-table-button-active" : ""}`}
                    onClick={() => setSelectedUser(user.id)}
                  >
                    {selectedUser === user.id ? "Mostrando" : "Ver reservas"}
                  </button>
                  <button
                    type="button"
                    className={`gestion-table-button ${user.status === "suspendida" ? "gestion-table-button-success" : "gestion-table-button-dangerous"}`}
                    onClick={() =>
                      setPendingAction({
                        id: user.id,
                        action:
                          user.status === "suspendida"
                            ? "reactivate"
                            : "suspend",
                      })
                    }
                  >
                    {user.status === "suspendida" ? "Reactivar" : "Suspender"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="gestion-reservas">
        {selectedUserData ? (
          <strong className="gestion-reservas-header">
            Reservas de {selectedUserData.displayName || selectedUserData.email}
          </strong>
        ) : (
          <strong>Selecciona un consumidor</strong>
        )}

        <table className="tabla-secundaria">
          <thead>
            <tr>
              {SECONDARY_TABLE_HEADERS.map((item) => (
                <th key={item}>{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedUser === null ? (
              <tr>
                <td colSpan={SECONDARY_TABLE_HEADERS.length}>
                  No hay un consumidor seleccionado.
                </td>
              </tr>
            ) : selectedReservations.length === 0 ? (
              <tr>
                <td colSpan={SECONDARY_TABLE_HEADERS.length}>
                  Este consumidor no tiene reservas registradas.
                </td>
              </tr>
            ) : (
              selectedReservations.map((reservation) => (
                <tr key={reservation.id_reserva}>
                  <td>{reservation.id_reserva}</td>
                  <td>{reservation.id_producto}</td>
                  <td>{reservation.fecha_reserva.toLocaleString()}</td>
                  <td>{reservation.cantidad}</td>
                  <td>{reservation.estado_reserva}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pendingAction && (
        <ConfirmDialog
          title={
            pendingAction.action === "suspend"
              ? "Suspender consumidor"
              : "Reactivar consumidor"
          }
          message={
            pendingAction.action === "suspend"
              ? "¿Deseas suspender a este consumidor? El estado del usuario pasará a suspendida."
              : "¿Deseas reactivar a este consumidor? El estado volverá a activa."
          }
          confirmLabel={
            pendingAction.action === "suspend" ? "Suspender" : "Reactivar"
          }
          variant={pendingAction.action === "suspend" ? "danger" : "primary"}
          loading={statusUpdating}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmUserStatusChange}
        />
      )}
    </>
  );
}
