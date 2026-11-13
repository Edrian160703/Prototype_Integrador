import { useState } from "react";
import useAdminDashboard from "../../hooks/useAdminDashboard";
import GestionComercio from "./GestionComercio";
import GestionConsumidor from "./GestionConsumidor";
import GestionOfertas from "./GestionOfertas";

export const MANAGEMENT_USER_TYPES = [
  { key: "consumidor", label: "Consumidor", icon: "🧑" },
  { key: "comercio", label: "Comercio", icon: "🛒" },
  { key: "ofertas", label: "Ofertas", icon: "🏷️" },
];

export interface ManagementData {
  key: string;
  info: any;
}

export default function AdminGestion() {
  const { loadError } = useAdminDashboard();
  const [typeSelected, setTypeSelected] = useState("consumidor");

  if (loadError) {
    return (
      <>
        <div className="error">Ocurrio un error inesperado: {loadError}</div>
      </>
    );
  }

  return (
    <div className="admin-management">
      <div className="admin-type-container">
        {MANAGEMENT_USER_TYPES.map((item) => {
          return (
            <button
              key={item.key}
              type="button"
              className={`admin-user-type-button ${
                typeSelected === item.key ? "admin-user-type-button-active" : ""
              }`}
              onClick={() => setTypeSelected(item.key)}
            >
              {" "}
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="management-container">
        <div
          className={`management-section ${typeSelected === "consumidor" ? "management-section-active" : "management-section-hidden"}`}
        >
          <GestionConsumidor />
        </div>
        <div
          className={`management-section ${typeSelected === "comercio" ? "management-section-active" : "management-section-hidden"}`}
        >
          <GestionComercio />
        </div>
        <div
          className={`management-section ${typeSelected === "ofertas" ? "management-section-active" : "management-section-hidden"}`}
        >
          <GestionOfertas />
        </div>
      </div>
    </div>
  );
}
