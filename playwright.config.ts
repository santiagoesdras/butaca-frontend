import { defineConfig, devices } from "@playwright/test";

const PORT = 4317;

/**
 * Pruebas E2E: la app real corre en Vite y un navegador Chromium la usa como lo haría una persona.
 * El Gateway y Supabase se simulan dentro del navegador (e2e/support/fake-butaca.ts) con el mismo
 * contrato que el backend, para que las pruebas no necesiten credenciales y puedan correr en CI.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "es-GT",
    timezoneId: "America/Guatemala",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Cámara simulada de Chromium: entrega video de prueba sin pedir permiso al sistema operativo.
    permissions: ["camera"],
    launchOptions: {
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Variables del entorno de prueba: tienen prioridad sobre .env.local, así nunca se usan las reales.
    env: {
      VITE_API_URL: "http://api.butaca.test",
      VITE_PUBLIC_SUPABASE_URL: "https://e2e.supabase.co",
      VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_e2e",
    },
  },
});
