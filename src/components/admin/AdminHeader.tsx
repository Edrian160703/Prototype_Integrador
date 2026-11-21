import { Link } from "react-router-dom";
import darkModeIcon from "../../assets/images/dark-mode-icon.png";
import useThemePreference from "../../hooks/useThemePreference";
import BrandLogo from "../BrandLogo";

export default function AdminHeader() {
  const { darkMode, toggleTheme } = useThemePreference();

  return (
    <header>
      <Link className="goback" to="/">
        <p>Volver a la página principal</p>
        <div>►</div>
      </Link>
      <button
        className={`admin-theme-toggle${darkMode ? " is-dark" : ""}`}
        type="button"
        aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        aria-pressed={darkMode}
        title={darkMode ? "Modo claro" : "Modo oscuro"}
        onClick={toggleTheme}
      >
        <img src={darkModeIcon} alt="" aria-hidden="true" />
      </button>
      <div className="logo admin-brand-logo">
        <BrandLogo />
      </div>
    </header>
  );
}
