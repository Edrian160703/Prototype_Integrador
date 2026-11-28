import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccountsPanel, {
  type ManagedAccount,
} from "../../src/components/admin/AccountsPanel";
import ProductsPanel from "../../src/components/admin/ProductsPanel";
import type { ProductoAdminItem } from "../../src/types/productoAdmin";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const accounts: ManagedAccount[] = [
  {
    id: "account-1",
    role: "consumer",
    displayName: "Ada Lovelace",
    email: "ada@example.com",
    status: "activa",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    lastActiveAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    id: "account-2",
    role: "consumer",
    displayName: "Grace Hopper",
    email: "grace@example.com",
    status: "suspendida",
    createdAt: new Date("2024-01-02T00:00:00Z"),
    lastActiveAt: new Date("2025-01-02T00:00:00Z"),
  },
  {
    id: "account-3",
    role: "consumer",
    displayName: "Katherine Johnson",
    email: "katherine@example.com",
    status: "pendiente",
    createdAt: new Date("2024-01-03T00:00:00Z"),
    lastActiveAt: new Date("2025-01-03T00:00:00Z"),
  },
];

const products: ProductoAdminItem[] = [
  {
    id: "product-1",
    name: "Pan integral",
    category: "Panadería",
    storeName: "La Esquina",
    price: 5,
    stock: 10,
    status: "activo",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    id: "product-2",
    name: "Leche fresca",
    category: "Lácteos",
    storeName: "La Esquina",
    price: 4,
    stock: 0,
    status: "agotado",
    createdAt: new Date("2024-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
  {
    id: "product-3",
    name: "Pan blanco",
    category: "Panadería",
    storeName: "Mercado Central",
    price: 3,
    stock: 5,
    status: "pausado",
    createdAt: new Date("2024-01-03T00:00:00Z"),
    updatedAt: new Date("2025-01-03T00:00:00Z"),
  },
];

describe("panel de cuentas", () => {
  it("combina búsqueda y estado, informa cuando no hay coincidencias y muestra conteos", () => {
    const { container } = render(
      <AccountsPanel
        entityLabel="usuario"
        entityLabelPlural="usuarios"
        initialAccounts={accounts}
        onStatusChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      Array.from(container.querySelectorAll(".stat-value")).map((node) => node.textContent),
    ).toEqual(["3", "1", "1", "1"]);

    fireEvent.change(screen.getByPlaceholderText("Buscar usuarios por nombre o correo"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Filtrar por fecha de creación"), {
      target: { value: "todos" },
    });
    fireEvent.change(screen.getByLabelText("Filtrar usuarios por estado"), {
      target: { value: "suspendida" },
    });
    expect(screen.getByText("No hay usuarios que coincidan con los filtros.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Filtrar usuarios por estado"), {
      target: { value: "todas" },
    });
    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
  });

  it("ejecuta el cambio de estado solo después de confirmar", async () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    render(
      <AccountsPanel
        entityLabel="usuario"
        entityLabelPlural="usuarios"
        initialAccounts={[accounts[2]]}
        onStatusChange={onStatusChange}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle("Activar usuario"));
    expect(screen.getByRole("dialog").textContent).toContain("recuperará el acceso");
    expect(onStatusChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Confirmar"));

    await waitFor(() =>
      expect(onStatusChange).toHaveBeenCalledWith("account-3", "activa"),
    );
    expect(screen.getByText("Activa", { selector: ".status-badge" })).toBeTruthy();
    expect(
      Array.from(document.querySelectorAll(".stat-value")).map((node) => node.textContent),
    ).toEqual(["1", "1", "0", "0"]);
  });

  it("cancela la confirmación de cambio de estado sin ejecutar la acción", () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    render(
      <AccountsPanel
        entityLabel="usuario"
        entityLabelPlural="usuarios"
        initialAccounts={[accounts[2]]}
        onStatusChange={onStatusChange}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle("Activar usuario"));
    fireEvent.click(screen.getByText("Cancelar"));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it("filtra por fecha de creación sin confundirla con la última actividad", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-23T12:00:00"));
    render(
      <AccountsPanel
        entityLabel="usuario"
        entityLabelPlural="usuarios"
        initialAccounts={[
          { ...accounts[0], createdAt: new Date("2026-10-23T11:30:00"), lastActiveAt: new Date("2020-01-01") },
          { ...accounts[1], createdAt: new Date("2020-01-01"), lastActiveAt: new Date("2026-10-23T11:45:00") },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Filtrar por fecha de creación"), {
      target: { value: "ultima-hora" },
    });
    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.queryByText("Grace Hopper")).toBeNull();
    vi.useRealTimers();
  });

  it("presenta error administrativo sin actualizar optimistamente una cuenta", async () => {
    const onStatusChange = vi.fn().mockRejectedValue(new Error("permission denied"));
    render(
      <AccountsPanel
        entityLabel="usuario"
        entityLabelPlural="usuarios"
        initialAccounts={[accounts[2]]}
        onStatusChange={onStatusChange}
      />,
    );

    fireEvent.click(screen.getByTitle("Activar usuario"));
    fireEvent.click(screen.getByText("Confirmar"));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("Pendiente", { selector: ".status-badge" })).toBeTruthy();
  });
});

describe("panel de productos", () => {
  it("combina búsqueda, comercio y estado, e informa conteos correctos", () => {
    const { container } = render(<ProductsPanel initialProducts={products} />);

    expect(
      Array.from(container.querySelectorAll(".stat-value")).map((node) => node.textContent),
    ).toEqual(["3", "1", "1", "1"]);
    fireEvent.change(screen.getByPlaceholderText("Buscar producto o comercio"), {
      target: { value: "pan" },
    });
    const storeFilter = screen.getByLabelText("Filtrar productos por comercio");
    const statusFilter = screen.getByLabelText("Filtrar productos por estado");
    fireEvent.change(storeFilter, { target: { value: "La Esquina" } });
    fireEvent.change(statusFilter, { target: { value: "activo" } });
    expect(screen.getByText("Pan integral")).toBeTruthy();

    fireEvent.change(statusFilter, { target: { value: "pausado" } });
    expect(screen.getByText("No hay productos que coincidan con los filtros.")).toBeTruthy();
  });

  it("archiva el producto únicamente después de confirmar", async () => {
    const onArchive = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductsPanel
        initialProducts={[products[0]]}
        onDelete={onArchive}
        onStatusChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle("Archivar producto"));
    expect(screen.getByRole("dialog").textContent).toContain("Pan integral");
    expect(screen.getByRole("dialog").textContent).toContain("historial");
    expect(onArchive).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Confirmar"));

    await waitFor(() => expect(onArchive).toHaveBeenCalledWith("product-1"));
    expect(screen.getByText("No hay productos que coincidan con los filtros.")).toBeTruthy();
    expect(
      Array.from(document.querySelectorAll(".stat-value")).map((node) => node.textContent),
    ).toEqual(["0", "0", "0", "0"]);
  });

  it("cancela la confirmación de archivado sin retirar el producto", () => {
    const onArchive = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductsPanel
        initialProducts={[products[0]]}
        onDelete={onArchive}
        onStatusChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTitle("Archivar producto"));
    fireEvent.click(screen.getByText("Cancelar"));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onArchive).not.toHaveBeenCalled();
    expect(screen.getByText("Pan integral")).toBeTruthy();
  });

  it("filtra por fecha de creación del producto", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-23T12:00:00"));
    render(
      <ProductsPanel
        initialProducts={[
          { ...products[0], createdAt: new Date("2026-10-23T11:30:00") },
          { ...products[1], createdAt: new Date("2020-01-01") },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Filtrar por fecha de creación"), {
      target: { value: "ultima-hora" },
    });
    expect(screen.getByText("Pan integral")).toBeTruthy();
    expect(screen.queryByText("Leche fresca")).toBeNull();
    vi.useRealTimers();
  });

  it("presenta error administrativo sin archivar optimistamente el producto", async () => {
    const onArchive = vi.fn().mockRejectedValue(new Error("permission denied"));
    render(<ProductsPanel initialProducts={[products[0]]} onDelete={onArchive} />);

    fireEvent.click(screen.getByTitle("Archivar producto"));
    fireEvent.click(screen.getByText("Confirmar"));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("Pan integral")).toBeTruthy();
  });

  it("muestra la foto y fecha privada de vencimiento al abrir el detalle ADMIN", async () => {
    const image = new Blob(["evidence"], { type: "image/png" });
    const onLoadExpirationEvidence = vi.fn().mockResolvedValue({
      expirationDate: "2027-05-09",
      image,
    });
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn().mockReturnValue("blob:admin-evidence"),
      revokeObjectURL: vi.fn(),
    });
    render(
      <ProductsPanel
        initialProducts={[products[0]]}
        onLoadExpirationEvidence={onLoadExpirationEvidence}
      />,
    );

    fireEvent.click(screen.getByLabelText("Ver vencimiento de Pan integral"));

    expect(await screen.findByText("Fecha de vencimiento reconocida por IA:")).toBeTruthy();
    expect(screen.getByText("2027-05-09")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Evidencia de vencimiento de Pan integral" })
      .getAttribute("src")).toBe("blob:admin-evidence");
    expect(onLoadExpirationEvidence).toHaveBeenCalledWith("product-1");
    fireEvent.click(screen.getByLabelText("Cerrar evidencia"));
  });
});
