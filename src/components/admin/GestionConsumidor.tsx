import { useEffect, useMemo, useState } from "react";
import useAdminDashboard from "../../hooks/useAdminDashboard";
import type { ManagedAccount } from "./AccountsPanel";
import type { ReservaDocument } from "../../types/reserva";
import type { ProductoAdminItem } from "../../types/productoAdmin";

const TABLE_HEADERS: string[] = [
  "Reserva",
  "Producto",
  "Fecha de Reserva",
  "Cantidad Reservada",
  "Estado de reserva",
];

export default function GestionConsumidor() {
  const { users, products, reservations } = useAdminDashboard();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

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
    return snapshot.reservations.filter((reservation) => reservation.id_usuario === selectedUser);
  }, [selectedUser, snapshot.reservations]);

  const selectedUserData = useMemo(() => {
    if (!selectedUser || !snapshot.users) return null;
    return snapshot.users.find((user) => user.id === selectedUser) ?? null;
  }, [selectedUser, snapshot.users]);

  console.log(snapshot.users)
  console.log(snapshot.reservations)

  return (
    <>
      <table className="tabla-main">
        <thead>
          <tr>
            <th className="static-header">ID</th>
            <th className="static-header">Correo</th>
            <th className="static-header">DNI</th>
            <th className="static-header">Número de teléfono</th>
            <th>Nombre de consumidor</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.users === null ? (
            <tr>
              <td colSpan={3}>…</td>
            </tr>
          ) : (
            snapshot.users.map((user) => (
              <tr key={user.id} className={selectedUser === user.id ? "gestion-row-selected" : ""}>
                <td className="static-cell">{user.id}</td>
                <td className="static-cell">{user.email}</td>
                <td className="static-cell">{user.dni}</td>
                <td className="static-cell">{user.phone}</td>
                <td className="static-cell">{user.displayName}</td>
                <td className="static-cell">
                  <button
                    type="button"
                    className={`gestion-table-button ${selectedUser === user.id ? "gestion-table-button-active" : ""}`}
                    onClick={() => setSelectedUser(user.id)}
                  >
                    {selectedUser === user.id ? "Mostrando" : "Ver reservas"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="gestion-reservas-header">
        {selectedUserData ? (
          <strong>Reservas de {selectedUserData.displayName || selectedUserData.email}</strong>
        ) : (
          <strong>Selecciona un consumidor</strong>
        )}
      </div>

      <table className="tabla-secundaria">
        <thead>
          <tr>
            {TABLE_HEADERS.map((item) => (
              <th key={item}>{item}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {selectedUser === null ? (
            <tr>
              <td colSpan={TABLE_HEADERS.length}>No hay un consumidor seleccionado.</td>
            </tr>
          ) : selectedReservations.length === 0 ? (
            <tr>
              <td colSpan={TABLE_HEADERS.length}>Este consumidor no tiene reservas registradas.</td>
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
    </>
  );
}

