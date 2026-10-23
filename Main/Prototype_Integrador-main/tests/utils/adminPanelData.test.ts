import { describe, expect, it } from "vitest";
import {
  countAdminStatuses,
  filterAdminItems,
  paginateAdminItems,
} from "../../src/utils/adminPanelData";

interface Item {
  name: string;
  store: string;
  status: "activo" | "pausado";
}

const items: Item[] = [
  { name: "Pan integral", store: "La Esquina", status: "activo" },
  { name: "Leche", store: "La Esquina", status: "pausado" },
  { name: "Pan blanco", store: "Mercado Central", status: "activo" },
];

describe("adminPanelData", () => {
  it("busca en campos individuales y combina el filtro propio del listado", () => {
    const results = filterAdminItems(
      items,
      "PAN",
      (item) => [item.name, item.store],
      (item) => item.store === "La Esquina" && item.status === "activo",
    );

    expect(results).toEqual([items[0]]);
    expect(
      filterAdminItems(items, "sin coincidencias", (item) => [item.name], () => true),
    ).toEqual([]);
  });

  it("pagina con límites seguros y ajusta la página al reducir los resultados", () => {
    const manyItems = Array.from({ length: 9 }, (_, index) => index);

    expect(paginateAdminItems(manyItems, 2, 8)).toEqual({
      pageItems: [8],
      currentPage: 2,
      totalPages: 2,
    });
    expect(paginateAdminItems(manyItems.slice(0, 8), 2, 8)).toEqual({
      pageItems: manyItems.slice(0, 8),
      currentPage: 1,
      totalPages: 1,
    });
    expect(paginateAdminItems([], 5, 8)).toEqual({
      pageItems: [],
      currentPage: 1,
      totalPages: 1,
    });
  });

  it("calcula conteos por estado", () => {
    const counts = countAdminStatuses(items, ["activo", "pausado"], (item) => item.status);

    expect(counts.get("activo")).toBe(2);
    expect(counts.get("pausado")).toBe(1);
  });
});
