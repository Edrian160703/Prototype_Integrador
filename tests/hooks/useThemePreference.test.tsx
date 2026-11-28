import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import useThemePreference from "../../src/hooks/useThemePreference";

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

function ThemeToggle() {
  const { darkMode, toggleTheme } = useThemePreference();
  return (
    <button type="button" onClick={toggleTheme}>
      {darkMode ? "Modo oscuro" : "Modo claro"}
    </button>
  );
}

describe("preferencia de tema", () => {
  it("persiste el tema oscuro al alternar y lo restaura al volver a montar", () => {
    localStorage.setItem("foodback-theme", "light");
    const { unmount } = render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Modo claro" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("foodback-theme")).toBe("dark");

    unmount();
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Modo oscuro" })).toBeTruthy();
  });
});
