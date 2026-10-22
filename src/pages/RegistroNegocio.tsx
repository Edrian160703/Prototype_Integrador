import { useEffect, useRef, useState, type FormEvent } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";

export default function RegistroNegocio() {
  const [sent, setSent] = useState(false);
  const [address, setAddress] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Solo funcionalidad visual: no se realiza ninguna petición HTTP ni se guardan datos.
    setSent(true);
  };

  useEffect(() => {
    if (!mapOpen || !mapContainerRef.current) return;

    const districtBounds = L.latLngBounds(
      [-12.08, -77.08],
      [-11.86, -76.89],
    );
    const map = L.map(mapContainerRef.current, {
      maxBounds: districtBounds,
      maxBoundsViscosity: 1,
    }).setView([-11.97, -76.99], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    let geocodeTimeout: number | null = null;
    let activeRequest: AbortController | null = null;

    map.on("click", (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng(event.latlng);
      } else {
        const icon = L.divIcon({
          className: "location-picker-marker",
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        markerRef.current = L.marker(event.latlng, { icon }).addTo(map);
      }

      if (geocodeTimeout !== null) window.clearTimeout(geocodeTimeout);
      activeRequest?.abort();
      setAddress("");
      setLocationStatus("Buscando la dirección...");

      geocodeTimeout = window.setTimeout(async () => {
        const controller = new AbortController();
        activeRequest = controller;

        try {
          const params = new URLSearchParams({
            format: "jsonv2",
            lat: String(lat),
            lon: String(lng),
            "accept-language": "es",
          });
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
            { signal: controller.signal },
          );
          if (!response.ok) {
            throw new Error(`La búsqueda de dirección respondió ${response.status}`);
          }

          const result: {
            display_name?: string;
            address?: Record<string, string>;
            name?: string;
          } = await response.json();
          if (!result.display_name) {
            throw new Error("No se encontró una dirección para esta ubicación");
          }

          const districtName = (result.address?.city_district
            ?? result.address?.district
            ?? result.address?.municipality
            ?? result.address?.suburb
            ?? result.name
            ?? "").toLocaleLowerCase("es").trim();
          const isInDistrict =
            result.address?.country_code?.toLocaleLowerCase() === "pe" &&
            districtName === "san juan de lurigancho";

          if (!isInDistrict) {
            markerRef.current?.remove();
            markerRef.current = null;
            setAddress("");
            setLocationStatus(
              "El punto seleccionado está fuera de San Juan de Lurigancho. Elige una ubicación dentro del distrito.",
            );
            return;
          }

          setAddress(result.display_name);
          setLocationStatus("Dirección actualizada. Puedes editarla si lo necesitas.");
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error("No se pudo obtener la dirección seleccionada.", error);
          setLocationStatus(
            "No pudimos obtener la dirección. Intenta seleccionar otro punto o escríbela manualmente.",
          );
        }
      }, 1000);
    });

    return () => {
      if (geocodeTimeout !== null) window.clearTimeout(geocodeTimeout);
      activeRequest?.abort();
      map.remove();
      markerRef.current = null;
    };
  }, [mapOpen]);

  if (sent) {
    return (
      <section className="section container">
        <div className="form-card form-card-wide success-box">
          <div className="success-icon">🌱</div>
          <h2>Solicitud enviada correctamente</h2>
          <p>
            Nuestro equipo revisará la información de tu negocio y se pondrá en
            contacto contigo en menos de 24 horas.
          </p>
          <Link className="btn btn-primary" to="/para-negocios">
            Volver a Para negocios
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section container">
      <div className="form-card form-card-wide">
        <h2>Registra tu negocio 🌱</h2>
        <p>Completa el formulario y nos contactamos en menos de 24 h.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-section-title">Información del negocio</div>
          <div className="field">
            <label>Nombre del negocio</label>
            <input placeholder="Ej. Panadería El Trigo" required />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Tipo de negocio</label>
              <select defaultValue="">
                <option value="" disabled>
                  Selecciona una opción
                </option>
                <option>Panadería</option>
                <option>Restaurante</option>
                <option>Cafetería</option>
                <option>Pastelería</option>
                <option>Tienda</option>
              </select>
            </div>
            <div className="field">
              <label>RUC</label>
              <input placeholder="20123456789" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Correo electrónico</label>
              <input type="email" placeholder="hola@tunegocio.pe" required />
            </div>
            <div className="field">
              <label>Teléfono / WhatsApp</label>
              <input placeholder="+51 999 000 111" required />
            </div>
          </div>
          <div className="field">
            <label htmlFor="business-address">Dirección</label>
            <input
              id="business-address"
              placeholder="Av. Principal 123"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-outline location-picker-toggle"
              aria-expanded={mapOpen}
              onClick={() => setMapOpen((open) => !open)}
            >
              {mapOpen ? "Cerrar mapa" : "Elegir ubicación en el mapa"}
            </button>
            {mapOpen && (
              <div className="location-picker">
                <p>
                  Selecciona una ubicación dentro del distrito de San Juan de
                  Lurigancho, Lima, Perú.
                </p>
                <div
                  ref={mapContainerRef}
                  className="location-picker-map"
                  aria-label="Mapa para elegir la ubicación del negocio"
                />
                <div className="location-picker-status" aria-live="polite">
                  {locationStatus || "Busca el lugar y selecciona un punto en el mapa."}
                </div>
              </div>
            )}
          </div>

          <div className="form-section-title">Información del responsable</div>
          <div className="field-row">
            <div className="field">
              <label>Nombre del responsable</label>
              <input placeholder="Nombre" required />
            </div>
            <div className="field">
              <label>Apellidos</label>
              <input placeholder="Apellidos" required />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Teléfono</label>
              <input placeholder="+51 999 000 111" required />
            </div>
            <div className="field">
              <label>Correo</label>
              <input
                type="email"
                placeholder="responsable@correo.pe"
                required
              />
            </div>
          </div>

          <div className="form-section-title">Información adicional</div>
          <div className="field">
            <label>Horario de atención</label>
            <input placeholder="Lun a Sáb, 8:00 am - 8:00 pm" />
          </div>
          <div className="field">
            <label>Descripción del negocio</label>
            <textarea placeholder="Cuéntanos brevemente sobre tu negocio y los productos que ofreces..." />
          </div>

          <div className="terms-note">
            Al enviar aceptas nuestros términos de servicio
          </div>

          <div className="form-actions">
            <Link className="btn btn-outline btn-block" to="/para-negocios">
              Cancelar / Volver
            </Link>
            <button type="submit" className="btn btn-primary btn-block">
              Registrar negocio
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
