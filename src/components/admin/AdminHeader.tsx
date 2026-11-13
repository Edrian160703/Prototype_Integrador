import { Link } from "react-router-dom";
import logo from "../../assets/images/logo_thin.png";

export default function AdminHeader() {
  return (
    <header>
      <Link className="goback" to="/">
        <p>Volver a la página principal</p>
        <div>►</div>
      </Link>
      <div className="logo">
        <img src={logo} />
      </div>
    </header>
  );
}
