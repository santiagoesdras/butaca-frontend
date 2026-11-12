import { expect, test } from "@playwright/test";
import { FakeButaca } from "./support/fake-butaca";

/**
 * Flujo 1 — Acceso y catálogo.
 * "Que cada quien entre con su cuenta" y "que las pelis salgan de TMDB" sin exponer llaves.
 */
test.describe("Acceso y catálogo", () => {
  test("sin sesión, la app exige iniciar sesión con Google o GitHub", async ({ page }) => {
    const butaca = new FakeButaca();
    await butaca.install(page, { signedIn: false });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar con GitHub" })).toBeVisible();

    // Elegir Google redirige al proveedor OAuth configurado en Supabase.
    await page.getByRole("button", { name: "Continuar con Google" }).click();
    await page.waitForURL(/e2e\.supabase\.co\/auth\/v1\/authorize/);
    expect(new URL(page.url()).searchParams.get("provider")).toBe("google");

    // Ninguna ruta privada se consultó sin sesión.
    expect(butaca.requests.filter((request) => request.path.startsWith("/api/v1/library"))).toHaveLength(0);
  });

  test("con sesión, muestra el catálogo y el detalle de un título sin llamar a TMDB desde el navegador", async ({ page }) => {
    const butaca = new FakeButaca();
    await butaca.install(page);
    const directTmdbCalls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("api.themoviedb.org")) directTmdbCalls.push(request.url());
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Lo más visto hoy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ver detalles de Coco" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Ver detalles de Coco" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Coco" })).toBeVisible();
    await expect(dialog.getByText("Animación, Familia")).toBeVisible();
    // El póster ocupa toda su columna: sin franja vacía debajo aunque el texto sea más alto.
    const poster = await dialog.getByTestId("details-poster").boundingBox();
    expect(poster?.height ?? 0).toBeGreaterThanOrEqual(330);
    await dialog.getByRole("button", { name: "Cerrar detalles" }).click();
    await expect(dialog).toBeHidden();

    // El detalle se pidió al Gateway con el tipo y el id; la llave de TMDB nunca llega al navegador.
    expect(butaca.calls("GET", "/api/v1/media/movie/354912").length).toBeGreaterThan(0);
    // En desarrollo React (StrictMode) ejecuta los efectos dos veces; basta con que se haya pedido.
    expect(butaca.calls("GET", "/api/v1/media/trending").length).toBeGreaterThan(0);
    expect(directTmdbCalls).toEqual([]);
  });
});
