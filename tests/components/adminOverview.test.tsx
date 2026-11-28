import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminAccountInspector from "../../src/components/admin/AdminAccountInspector";
import AdminOverview from "../../src/components/admin/AdminOverview";
import type { ManagedAccount } from "../../src/ports/accountRepository";
import type { OfertaConComercio } from "../../src/types/oferta";
import type { ProductoAdminItem } from "../../src/types/productoAdmin";
import type { ReservaDocument } from "../../src/types/reserva";

afterEach(cleanup);

const consumer: ManagedAccount = {
  id: "consumer-1",
  role: "consumer",
  displayName: "Ada Lovelace",
  email: "ada@example.com",
  status: "activa",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  lastActiveAt: new Date("2025-02-01T00:00:00Z"),
};

const reservation: ReservaDocument = {
  id_reserva: "reservation-1",
  id_usuario: consumer.id,
  email_usuario: consumer.email,
  id_producto: "offer-1",
  fecha_reserva: new Date("2025-02-02T00:00:00Z"),
  cantidad: 2,
  estado_reserva: "pendiente",
};

const offer: OfertaConComercio = {
  id: "offer-1",
  data: {
    id_producto: "product-1",
    id_comercio: "store-1",
    id_categoria: "panaderia",
    nombre_producto: "Pan integral",
    descripcion: "",
    precio_original: 8,
    precio_oferta: 5,
    cantidad_disponible: 3,
    horario_recojo: "",
    estado: "disponible",
    fecha_limite: new Date("2025-03-01T00:00:00Z"),
    imagen_url: null,
  },
  comercio: null,
};

const product: ProductoAdminItem = {
  id: "product-1",
  name: "Pan integral",
  category: "Panadería",
  storeName: "Mercado Central",
  price: 8,
  stock: 3,
  status: "activo",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-02-01T00:00:00Z"),
};

describe("resumen administrativo", () => {
  it("permite abrir detalles de una cuenta y navegar a sus gestiones", () => {
    const onSelectAccount = vi.fn();
    const onSelectTab = vi.fn();

    render(
      <AdminOverview
        users={[consumer]}
        stores={[]}
        reservations={[]}
        offers={[]}
        onSelectAccount={onSelectAccount}
        onSelectTab={onSelectTab}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver información de Ada Lovelace" }));
    expect(onSelectAccount).toHaveBeenCalledWith(consumer);

    fireEvent.click(screen.getByRole("button", { name: "Ver todas" }));
    expect(onSelectTab).toHaveBeenCalledWith("ofertas");
  });

  it("muestra las reservas asociadas a la cuenta seleccionada y permite cerrar el detalle", () => {
    const onClose = vi.fn();

    render(
      <AdminAccountInspector
        account={consumer}
        products={[product]}
        offers={[offer]}
        reservations={[reservation]}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("heading", { name: "Ada Lovelace" })).toBeTruthy();
    expect(screen.getByText("Pan integral")).toBeTruthy();
    expect(screen.getByText("Reserva reservation-1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar información" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("muestra las publicaciones del comercio por UID con su imagen y detalles", () => {
    const store: ManagedAccount = {
      id: "store-document-1",
      uid: "store-1",
      role: "store",
      displayName: "Mercado Central",
      email: "store@example.com",
      status: "activa",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      lastActiveAt: new Date("2025-02-01T00:00:00Z"),
    };
    const publishedOffer: OfertaConComercio = {
      ...offer,
      data: {
        ...offer.data,
        id_comercio: "store-1",
        descripcion: "Pan artesanal horneado hoy",
        imagen_url: "https://images.example.com/pan-integral.jpg",
      },
    };

    render(
      <AdminAccountInspector
        account={store}
        products={[product]}
        offers={[publishedOffer]}
        reservations={[]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Pan artesanal horneado hoy")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Imagen de Pan integral" }).getAttribute("src"))
      .toBe("https://images.example.com/pan-integral.jpg");
    expect(screen.getByText("Precio de oferta")).toBeTruthy();
    expect(screen.getByText("Disponibles")).toBeTruthy();
    expect(screen.queryByText("Este comercio no tiene ofertas publicadas.")).toBeNull();
  });
});
