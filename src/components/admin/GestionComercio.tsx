import { useEffect, useMemo, useState } from "react";
import useAdminDashboard from "../../hooks/useAdminDashboard";
import type { ManagedAccount } from "./AccountsPanel";
import type { OfertaConComercio } from "../../types/oferta";

const TABLE_HEADERS: string[] = [
  "Oferta",
  "Producto",
  "Precio de oferta",
  "Cantidad disponible",
  "Fecha límite",
  "Estado",
];

export default function GestionComercio() {
  const { stores, offers } = useAdminDashboard();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

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
    return snapshot.offers.filter((offer) => offer.data.id_comercio === selectedStore);
  }, [selectedStore, snapshot.offers]);

  const selectedStoreData = useMemo(() => {
    if (!selectedStore || !snapshot.stores) return null;
    return snapshot.stores.find((store) => store.id === selectedStore) ?? null;
  }, [selectedStore, snapshot.stores]);

  return (
    <>
      <table className="tabla-main">
        <thead>
          <tr>
            <th className="static-header">ID de Comercio</th>
            <th className="static-header">RUC</th>
            <th className="static-header">Dirección</th>
            <th>Nombre de comercio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.stores === null ? (
            <tr>
              <td colSpan={3}>…</td>
            </tr>
          ) : (
            snapshot.stores.map((store) => (
              <tr key={store.id} className={selectedStore === store.id ? "gestion-row-selected" : ""}>
                <td className="static-cell">{store.id}</td>
                <td className="static-cell">{store.ruc}</td>
                <td className="static-cell">{store.address}</td>
                <td className="static-cell">{store.displayName}</td>
                <td className="static-cell">
                  <button
                    type="button"
                    className={`gestion-table-button ${selectedStore === store.id ? "gestion-table-button-active" : ""}`}
                    onClick={() => setSelectedStore(store.id)}
                  >
                    {selectedStore === store.id ? "Mostrando" : "Ver ofertas"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="gestion-reservas-header">
        {selectedStoreData ? (
          <strong>Ofertas de {selectedStoreData.displayName || selectedStoreData.email}</strong>
        ) : (
          <strong>Selecciona un comercio</strong>
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
          {selectedStore === null ? (
            <tr>
              <td colSpan={TABLE_HEADERS.length}>No hay un comercio seleccionado.</td>
            </tr>
          ) : selectedOffers.length === 0 ? (
            <tr>
              <td colSpan={TABLE_HEADERS.length}>Este comercio no tiene ofertas registradas.</td>
            </tr>
          ) : (
            selectedOffers.map((offer) => (
              <tr key={offer.id}>
                <td>{offer.id}</td>
                <td>{offer.data.nombre_producto}</td>
                <td>{offer.data.precio_oferta.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })}</td>
                <td>{offer.data.cantidad_disponible}</td>
                <td>{offer.data.fecha_limite.toLocaleString()}</td>
                <td>{offer.data.estado}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
