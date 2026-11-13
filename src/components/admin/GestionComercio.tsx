import { useEffect, useMemo, useState } from "react";
import useAdminDashboard from "../../hooks/useAdminDashboard";
import type { ManagedAccount } from "../../ports/accountRepository";
import type { OfertaConComercio } from "../../types/oferta";
import ConfirmDialog from "./ConfirmDialog";

const SECONDARY_TABLE_HEADERS: string[] = [
  "Oferta",
  "Producto",
  "Precio de oferta",
  "Cantidad disponible",
  "Fecha límite",
  "Estado",
];

export default function GestionComercio() {
  const { stores, offers, handleStoreStatusChange } = useAdminDashboard();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: "suspend" | "reactivate";
  } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [snapshot, setSnapshot] = useState<{
    stores: ManagedAccount[] | null;
    offers: OfertaConComercio[] | null;
  }>({
    stores: null,
    offers: null,
  });

  useEffect(() => {
    setSnapshot({ stores, offers });
  }, [stores, offers]);

  const selectedOffers = useMemo(() => {
    if (!selectedStore || !snapshot.offers) return [];
    return snapshot.offers.filter(
      (offer) => offer.data.id_comercio === selectedStore,
    );
  }, [selectedStore, snapshot.offers]);

  const selectedStoreData = useMemo(() => {
    if (!selectedStore || !snapshot.stores) return null;
    return snapshot.stores.find((store) => store.id === selectedStore) ?? null;
  }, [selectedStore, snapshot.stores]);

  async function confirmStoreStatusChange() {
    if (!pendingAction) return;

    setStatusUpdating(true);
    try {
      const nextStatus =
        pendingAction.action === "suspend" ? "suspendida" : "activa";
      await handleStoreStatusChange(pendingAction.id, nextStatus);
      setSnapshot((current) => ({
        ...current,
        stores:
          current.stores?.map((store) =>
            store.id === pendingAction.id
              ? { ...store, status: nextStatus }
              : store,
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
            <th>RUC</th>
            <th>Dirección</th>
            <th>Nombre de comercio</th>
            <th>Estado</th>
            <th className="centered-cell">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.stores === null ? (
            <tr>
              <td colSpan={3}>…</td>
            </tr>
          ) : (
            snapshot.stores.map((store) => (
              <tr
                key={store.id}
                className={
                  selectedStore === store.id ? "gestion-row-selected" : ""
                }
              >
                <td className="static-cell">{store.id}</td>
                <td className="static-cell">{store.ruc}</td>
                <td className="static-cell">{store.address}</td>
                <td className="static-cell">{store.displayName}</td>
                <td className="static-cell">
                  <div
                    title={
                      store.status.charAt(0).toUpperCase() +
                      store.status.slice(1)
                    }
                    className={`cell-status cell-status-${store.status}`}
                  ></div>
                </td>
                <td className="static-cell actions-cell">
                  {/* BOTONES DE ACCION PARA EL ADMIN */}

                  <button
                    type="button"
                    className={`gestion-table-button ${selectedStore === store.id ? "gestion-table-button-active" : ""}`}
                    onClick={() => setSelectedStore(store.id)}
                  >
                    {selectedStore === store.id ? "Mostrando" : "Ver ofertas"}
                  </button>
                  <button
                    type="button"
                    className={`gestion-table-button ${store.status === "suspendida" ? "gestion-table-button-success" : "gestion-table-button-dangerous"}`}
                    onClick={() =>
                      setPendingAction({
                        id: store.id,
                        action:
                          store.status === "suspendida"
                            ? "reactivate"
                            : "suspend",
                      })
                    }
                  >
                    {store.status === "suspendida" ? "Reactivar" : "Suspender"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="gestion-reservas">
        {selectedStoreData ? (
          <strong className="gestion-reservas-header">
            Ofertas de {selectedStoreData.displayName}
          </strong>
        ) : (
          <strong>Selecciona un comercio</strong>
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
            {selectedStore === null ? (
              <tr>
                <td colSpan={SECONDARY_TABLE_HEADERS.length}>
                  No hay un comercio seleccionado.
                </td>
              </tr>
            ) : selectedOffers.length === 0 ? (
              <tr>
                <td colSpan={SECONDARY_TABLE_HEADERS.length}>
                  Este comercio no tiene ofertas registradas.
                </td>
              </tr>
            ) : (
              selectedOffers.map((offer) => (
                <tr key={offer.id}>
                  <td>{offer.id}</td>
                  <td>{offer.data.nombre_producto}</td>
                  <td>
                    {offer.data.precio_oferta.toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </td>
                  <td>{offer.data.cantidad_disponible}</td>
                  <td>{offer.data.fecha_limite.toLocaleString()}</td>
                  <td>{offer.data.estado}</td>
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
              ? "Suspender comercio"
              : "Reactivar comercio"
          }
          message={
            pendingAction.action === "suspend"
              ? "¿Deseas suspender a este comercio?"
              : "¿Deseas reactivar a este comercio?"
          }
          confirmLabel={
            pendingAction.action === "suspend" ? "Suspender" : "Reactivar"
          }
          variant={pendingAction.action === "suspend" ? "danger" : "primary"}
          loading={statusUpdating}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmStoreStatusChange}
        />
      )}
    </>
  );
}
