# Pruebas E2E (Playwright)

Estas pruebas usan Butaca como lo haría una persona: abren la app real (Vite) en un Chromium real, hacen clic, escriben y miran lo que aparece en pantalla. Cubren los tres flujos que más le importan a la clienta.

## Cómo ejecutarlas

```bash
npm ci
npx playwright install chromium   # solo la primera vez
npm run test:e2e                  # corre los tres flujos
npm run test:e2e:ui               # modo interactivo, paso a paso
npx playwright show-report        # reporte HTML del último resultado
```

Playwright levanta Vite solo (puerto 4317) con variables de prueba (`VITE_API_URL=http://api.butaca.test`, Supabase `https://e2e.supabase.co`). Esas variables tienen prioridad sobre `.env.local`, así que **las pruebas nunca usan tus credenciales ni el backend real**. Si falla algo, el reporte guarda captura de pantalla y traza (`npx playwright show-trace <archivo>`).

## Los tres flujos

| Archivo | Flujo | Qué verifica |
| --- | --- | --- |
| `01-acceso-y-catalogo.spec.ts` | **Acceso y catálogo** | Sin sesión, cualquier página redirige al login y "Continuar con Google" lleva al proveedor OAuth de Supabase; no se consultan rutas privadas. Con sesión, se ve el catálogo, se abre el detalle de un título (con sus géneros) y el navegador nunca llama a `api.themoviedb.org`: la llave de TMDB vive solo en el backend. |
| `02-animo-y-recomendacion.spec.ts` | **Ánimo y recomendación** | Se explica para qué es la cámara y se pide permiso; con la cámara simulada se captura, se analiza y se muestra la sugerencia ("Tristeza", 91.2 %); al confirmar se recomienda algo acorde ("Coco"). Comprueba que la foto viaja **una sola vez** (multipart a `/analyze`), que no existe la vieja ruta `/detections`, que se guarda la emoción confirmada `{ mood, confidence, time_zone }` sin imagen y que la recomendación se pide con `mood=SAD` y queda guardada en el día. Si la persona cancela, no se enciende la cámara, no se analiza nada y se revoca el consentimiento. |
| `03-favoritos-y-tablero.spec.ts` | **Favoritos y tablero** | Guarda un favorito desde el catálogo (`PUT /library/favorites/...`) y lo muestra en "Mis favoritos". El tablero muestra los datos del resumen del backend: días con registro, emoción predominante, recomendaciones, favoritos, recomendaciones recientes y géneros recomendados; cambiar entre 7 días, 30 días y Este año vuelve a pedir `/emotions/summary` con el período correcto. |

## Cómo funcionan

- **Backend y Supabase simulados** (`support/fake-butaca.ts`): intercepta en el navegador las llamadas al Gateway y a Supabase Auth y responde con **el mismo contrato que el backend real** (rutas, formas JSON, códigos y validaciones clave: consentimiento, campos admitidos, códigos de emoción). Guarda estado en memoria y registra cada petición para que las pruebas comprueben qué envió el frontend.
- **Sesión:** se inyecta una sesión de Supabase en `localStorage` antes de cargar la página, como la que deja el inicio de sesión real. El inicio de sesión con Google o GitHub ocurre en el proveedor y no se automatiza: el flujo 1 verifica que la app redirige al proveedor correcto.
- **Cámara:** Chromium se inicia con `--use-fake-device-for-media-stream`, que entrega un video de prueba; no se usa la cámara real.

## Qué no cubren

Estas pruebas validan el frontend completo contra el contrato del backend, no los servicios reales. Para eso:

- El backend tiene sus propias pruebas de integración (`npm test` en `butaca-backend`), que corren en CI.
- La validación conjunta con Supabase, la base de datos y AWS Rekognition reales se hace manualmente con cuentas reales (ver el README del backend).

## Errores que encontraron

Al escribir el flujo 2 aparecieron dos errores reales en `src/hooks/useCamera.ts`, ya corregidos:

1. "Capturar y analizar" se habilitaba un instante antes del primer cuadro de video; un clic en ese momento no hacía nada y no avisaba. Ahora la captura espera el primer cuadro (hasta 3 s).
2. Si la cámara se iniciaba dos veces (al remontar el componente), el primer stream quedaba encendido sin control. Ahora se apaga antes de reemplazarlo.
