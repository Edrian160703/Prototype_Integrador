import logoDark from "../assets/images/logo_transparent.png";
import logoLight from "../assets/images/logo_light.png";

export default function BrandLogo() {
  return (
    <>
      <img className="brand-logo-light" src={logoLight} alt="Foodback" />
      <img className="brand-logo-dark" src={logoDark} alt="Foodback" />
    </>
  );
}
