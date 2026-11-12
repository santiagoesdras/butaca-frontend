import { expect, test } from "@playwright/test";
import { CATALOG, FakeButaca } from "./support/fake-butaca";

const dayOffset = (days: number) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

/**
 * Flujo 3 — Favoritos y tablero.
 * "Guardar las que me gustan" y "ver cómo fue cambiando mi ánimo y qué me recomendaron".
 */
test.describe("Favoritos y tablero", () => {
  test("guarda un favorito y el tablero resume el ánimo y el contenido recomendado", async ({ page }) => {
    const butaca = new FakeButaca();
    const [coco, , , itCrowd] = CATALOG;
    butaca.seedHistory([
      { date: dayOffset(2), mood: "SAD", recommendation: coco },
      { date: dayOffset(1), mood: "HAPPY", recommendation: itCrowd },
      { date: dayOffset(0), mood: "SAD" },
    ]);
    await butaca.install(page);

    // Guardar Duna como favorita desde el catálogo.
    await page.goto("/");
    await page.getByRole("button", { name: "Agregar Duna a favoritos" }).first().click();
    await expect.poll(() => butaca.calls("PUT", "/api/v1/library/favorites/movie/438631").length).toBe(1);

    // Aparece en "Mis favoritos" (la lista viene del backend, por usuario).
    await page.goto("/favorites");
    await expect(page.getByRole("button", { name: "Ver detalles de Duna" })).toBeVisible();

    // El tablero usa el resumen agregado por el backend.
    await page.goto("/dashboard");
    const emotional = page.locator("section", { hasText: "Tu mundo emocional" });
    await expect(emotional.getByText("Días con registro").locator("..")).toContainText("3");
    await expect(emotional.getByText("Emoción predominante").locator("..")).toContainText("Tristeza");

    const cinema = page.locator("section", { hasText: "Tu recorrido cinematográfico" });
    // La etiqueta está en una fila con ícono; el número está en la tarjeta (dos niveles arriba).
    await expect(cinema.getByText("Favoritos guardados").locator("../..")).toContainText("1");
    await expect(cinema.getByText("Recomendaciones", { exact: true }).locator("../..")).toContainText("2");
    await expect(cinema.getByText("Coco")).toBeVisible();
    const genres = cinema.getByTestId("top-genres");
    await expect(genres).toContainText("Animación");
    await expect(genres).toContainText("Comedia");
    await expect(cinema.getByText("1 película · 1 serie")).toBeVisible();

    expect(butaca.calls("GET", "/api/v1/emotions/summary").at(-1)?.query.get("period")).toBe("30d");

    // Cambiar el período vuelve a pedir el resumen.
    await page.getByRole("button", { name: "7 días" }).click();
    await expect.poll(() => butaca.calls("GET", "/api/v1/emotions/summary").at(-1)?.query.get("period")).toBe("7d");
    await page.getByRole("button", { name: "Este año" }).click();
    await expect.poll(() => butaca.calls("GET", "/api/v1/emotions/summary").at(-1)?.query.get("period")).toBe("year");
    await expect(emotional.getByText("Emoción predominante").locator("..")).toContainText("Tristeza");
  });
});
