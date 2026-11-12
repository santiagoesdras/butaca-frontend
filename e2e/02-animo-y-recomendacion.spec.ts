import { expect, test } from "@playwright/test";
import { FakeButaca } from "./support/fake-butaca";

/**
 * Flujo 2 — Ánimo y recomendación (el flujo principal de Majo).
 * Consentimiento → cámara → análisis → confirmación → recomendación acorde al ánimo.
 */
test.describe("Ánimo y recomendación", () => {
  test("detecta el ánimo con permiso, guarda la emoción confirmada sin reenviar la foto y recomienda", async ({ page }) => {
    const butaca = new FakeButaca();
    await butaca.install(page);

    await page.goto("/recommendations");
    await page.getByRole("button", { name: "Analizar mi ánimo" }).click();

    // Se explica para qué es la cámara antes de encenderla.
    await expect(page.getByRole("heading", { name: "¿Podemos ver tu rostro un instante?" })).toBeVisible();
    await page.getByRole("button", { name: "Aceptar" }).click();

    // Cámara simulada de Chromium: el botón se habilita cuando hay video.
    const capture = page.getByRole("button", { name: "Capturar y analizar" });
    await expect(capture).toBeEnabled();
    await capture.click();

    // La sugerencia se muestra para que el usuario la confirme.
    await expect(page.getByText("Detectamos")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tristeza" })).toBeVisible();
    await expect(page.getByText("Confianza: 91.2%")).toBeVisible();
    await page.getByRole("button", { name: "Película" }).click();
    await page.getByRole("button", { name: "Confirmar" }).click();

    // Recomendación acorde a la tristeza: algo que levante el ánimo.
    await expect(page.getByText("Tu recomendación")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Coco" })).toBeVisible();

    // La foto viajó una sola vez, como multipart, a /analyze.
    const analyzed = butaca.calls("POST", "/api/v1/emotions/analyze");
    expect(analyzed).toHaveLength(1);
    expect(analyzed[0].headers["content-type"]).toContain("multipart/form-data");
    expect(butaca.requests.some((request) => request.path.endsWith("/detections"))).toBe(false);

    // Se guardó la emoción confirmada, con su confianza y la zona del navegador, sin imagen.
    const recorded = butaca.calls("POST", "/api/v1/emotions/history");
    expect(recorded).toHaveLength(1);
    expect(JSON.parse(recorded[0].body ?? "{}")).toEqual({ mood: "SAD", confidence: 91.2, time_zone: "America/Guatemala" });
    expect(butaca.consent).toBe(true);

    // La recomendación se pidió con el ánimo y quedó guardada en el día.
    const recommendation = butaca.calls("GET", "/api/v1/recommendations")[0];
    expect(recommendation.query.get("mood")).toBe("SAD");
    expect(recommendation.query.get("media_type")).toBe("movie");
    expect(butaca.history[0].recommendations.map((rec) => rec.title)).toEqual(["Coco"]);
  });

  test("si no da permiso, no se enciende la cámara ni se analiza nada", async ({ page }) => {
    const butaca = new FakeButaca();
    butaca.consent = true; // tenía un consentimiento previo
    await butaca.install(page);

    await page.goto("/recommendations");
    await page.getByRole("button", { name: "Analizar mi ánimo" }).click();
    await page.getByRole("button", { name: "Cancelar" }).click();

    await expect(page.getByRole("button", { name: "Capturar y analizar" })).toHaveCount(0);
    await expect.poll(() => butaca.calls("DELETE", "/api/v1/emotions/consent").length).toBe(1);
    expect(butaca.consent).toBe(false);
    expect(butaca.calls("POST", "/api/v1/emotions/analyze")).toHaveLength(0);
    expect(butaca.calls("POST", "/api/v1/emotions/history")).toHaveLength(0);
  });
});
