import { useState } from "react";
import useAdminDashboard, { type AdminTab } from "../../hooks/useAdminDashboard";

export const MANAGEMENT_USER_TYPES = [
  { key: "consumidor", label: "Consumidor", icon: "📊"},
  { key: "comercio", label: "Comercio", icon: "✨"},
];


export default function AdminGestion(){
    const {
      activeTab,
      setActiveTab,
      users,
      stores,
      products,
      reservations,
      offers,
      loadError,
      handleUserStatusChange,
      handleUserDelete,
      handleStoreStatusChange,
      handleStoreDelete,
      handleProductStatusChange,
      handleProductDelete,
      handleReservationStatusChange,
      handleReservationDelete,
    } = useAdminDashboard();
  const [typeSelected, setTypeSelected] = useState("consumidor")

    if (loadError) {}
    
 return(
  <div className="admin-management">
    <div className="admin-type-container">
      {MANAGEMENT_USER_TYPES.map((item) => {
        return (
          <button
            key={item.key}
            type="button"
            className={`admin-user-type-button ${(
              typeSelected === item.key) ? "admin-user-type-button" : ""}`}
            onClick={() => setTypeSelected(item.key)}
          > {item.label}</button>
        )
      })}
    </div>
    <div className="management-container">
      <table>
        <th>Correo del {MANAGEMENT_USER_TYPES.find((item) => item.key === typeSelected)?.label}</th>
        <th>Reserva</th>
        <th>Oferta</th>
        <th>Fecha</th>
        <th>Cantidad</th>

      </table>



    </div>


  </div>
 )
}
