# BUTACA — Frontend

Aplicación web que recomienda películas y series según el estado de ánimo del usuario. El ánimo se detecta con la cámara (análisis facial en el backend con AWS Rekognition) y las recomendaciones se generan a partir de una emoción confirmada por el usuario. Incluye historial emocional, dashboard con gráficas, favoritos por usuario y catálogo con paginación.

Este documento describe la arquitectura del frontend, cómo se conecta al backend y las decisiones técnicas tomadas durante la integración.

---

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Lenguaje | TypeScript 7 (strict) |
| Enrutamiento | React Router 7 |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Componentes UI | shadcn/ui (estilo New York) |
| Iconografía | Lucide React |
| Tipografía | Outfit (Fontsource) |
| Gráficas | Recharts |
| Animaciones | Motion (versión gratuita) |
| Autenticación | Supabase Auth (Google y GitHub) |
| Comunicación con backend | `fetch` nativo, centralizado en `src/services/` |
| Detección de emociones | AWS Rekognition (vía backend, no en el navegador) |

### Configuración de desarrollo

- Componentes en `.tsx`, lógica en `.ts`.
- Alias `@/` → `src/`.
- TypeScript en modo estricto.
- Tailwind v4 con variables CSS propias (no los defaults de shadcn).

---

## 2. Estructura del repositorio

```text
frontend/
├── src/
│   ├── components/
│   │   ├── camera/          # Permiso, vista de cámara y resultado de emoción
│   │   ├── common/          # PageHeader, EmptyState, ErrorState, Loading
│   │   ├── history/         # EmotionHeatmap, DayDetail, EmotionLegend
│   │   ├── layout/          # MainLayout, Navbar, Sidebar
│   │   ├── movies/          # MovieCard, MovieGrid, MovieDetails, FavoriteButton
│   │   └── ui/              # Componentes shadcn/ui
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCamera.ts
│   │   ├── useEmotionDetection.ts
│   │   └── useMoodHistory.ts
│   ├── lib/
│   │   ├── emotions.ts      # Catálogo de emociones + mappers front/back
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── DesignSystem.tsx # Página interna de referencia visual
│   │   ├── Favorites/
│   │   ├── History.tsx
│   │   ├── Home/
│   │   ├── Login/
│   │   └── Recommendations/
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   └── ProtectedRoute.tsx
│   ├── services/
│   │   ├── emotionService.ts
│   │   ├── favoritesService.ts
│   │   ├── historyService.ts
│   │   ├── movieService.ts
│   │   ├── recommendationsService.ts
│   │   └── supabase.ts
│   ├── types/
│   │   └── history.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts

## 3. Variables de entorno

Archivo `.env` en la raíz del frontend (basado en `.env.example`):

VITE_API_URL=http://localhost:8080
VITE_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>

Reglas:
- VITE_API_URL solo contiene el origen (http://localhost:8080). El cliente agrega /api/v1/... internamente. No duplicar el prefijo.
- Las claves de Supabase son públicas (anon/publishable). Van en el front sin problema.
- Nunca van en el front: TMDB_READ_ACCESS_TOKEN, SUPABASE_SERVICE_ROLE_KEY, credenciales de AWS ni DATABASE_URL. Todas viven en el .env del backend.

## 4. Autenticación

Se usa **Supabase Auth** con OAuth (Google y GitHub). El flujo es:

1. `Login.tsx` llama a `supabase.auth.signInWithOAuth({ provider })`.
2. Supabase redirige al proveedor y devuelve el `access_token` en la URL.
3. `AuthContext` detecta la sesión y la expone vía `useAuth()`.
4. `ProtectedRoute` redirige a `/login` si no hay sesión.
5. Cada servicio privado lee el token con `supabase.auth.getSession()` y lo manda como `Authorization: Bearer <token>`.

El backend valida el JWT (firma ES256, emisor, audiencia, expiración y `sub`). **El frontend nunca envía `user_id` ni `profile_id`**: el backend toma el usuario del token.


## 5. Conexión con el backend

Toda la comunicación con el API Gateway está centralizada en `src/services/`. Ningún componente hace `fetch` directo.

### 5.1. Endpoints consumidos

| Servicio | Endpoint | Auth | Uso |
|---|---|---|---|
| `movieService` | `GET /api/v1/media/trending?language=es-MX` | ❌ | Carrusel de tendencias en Home |
| `movieService` | `GET /api/v1/media/popular?media_type=movie&page=N&language=es-MX` | ❌ | Carrusel de películas populares (paginado) |
| `movieService` | `GET /api/v1/media/popular?media_type=tv&page=N&language=es-MX` | ❌ | Carrusel de series populares (paginado) |
| `movieService` | `GET /api/v1/media/:media_type/:id` | ❌ | Detalle de película/serie (MovieDetails y resolución de favoritos) |
| `recommendationsService` | `GET /api/v1/recommendations?media_type=&mood=&limit=&language=` | ✅ | Recomendación única por emoción |
| `emotionService` | `POST /api/v1/emotions/analyze` | ✅ | Análisis de la captura de cámara (multipart, efímero) |
| `historyService` | `POST /api/v1/emotions/history` | ✅ | Guardar la emoción **confirmada** (`mood`, `confidence` opcional, `time_zone`), sin imagen |
| `historyService` | `GET /api/v1/emotions/history?period=30d` o `?year=YYYY` | ✅ | Historial emocional (History con el año completo, Recommendations) |
| `historyService` | `GET /api/v1/emotions/summary?period=7d\|30d\|year` | ✅ | Datos del Dashboard ya agregados por el backend |
| `historyService` | `PUT /api/v1/emotions/history/:id/recommendations/:media_type/:tmdb_id` | ✅ | Asociar la recomendación a la detección |
| `historyService` | `GET/PUT/DELETE /api/v1/emotions/consent` | ✅ | Consentimiento de cámara |
| `favoritesService` | `GET /api/v1/library/favorites` | ✅ | Lista de favoritos del usuario |
| `favoritesService` | `PUT /api/v1/library/favorites/:media_type/:tmdb_id` | ✅ | Agregar favorito |
| `favoritesService` | `DELETE /api/v1/library/favorites/:media_type/:tmdb_id` | ✅ | Quitar favorito |

### 5.2. Contratos que el frontend asume

`GET /api/v1/emotions/history` devuelve:

{
  "results": [
    {
      "id": "uuid",
      "date": "2026-11-12",
      "mood": "HAPPY",
      "name": "Felicidad",
      "confidence": 92.34,
      "scores": [{ "mood": "HAPPY", "confidence": 92.34 }],
      "detected_at": "2026-11-12T21:14:00.000Z",
      "recommendations": [
        {
          "tmdb_id": 354912,
          "media_type": "movie",
          "title": "Coco",
          "poster_path": "/coco.jpg",
          "overview": "...",
          "release_date": "2017-10-27",
          "vote_average": 8.2,
          "genre_ids": [16, 10751],
          "saved_at": "2026-11-12T21:20:00.000Z"
        }
      ]
    }
  ]
}

El frontend mapea mood (HAPPY, SAD, …) al key interno (happy, sad, …) con toFrontendEmotion() en lib/emotions.ts. El back no tiene emotion en lowercase ni recommendedMovie como string: el front se adaptó a los tipos reales (HistoryEntry, SavedRecommendation).

GET /api/v1/library/favorites devuelve solo referencias:

{ "results": [{ "tmdb_id": 550, "media_type": "movie", "created_at": "..." }] }

Como no incluye título ni póster, favoritesService.getFavorites() hace N+1 a /api/v1/media/:media_type/:tmdb_id para resolver cada favorito a un Movie. Los resultados se cachean en memoria para no saturar el Gateway.

### 5.3. Manejo de errores

Cada servicio traduce los códigos HTTP del back a mensajes en español:

| Código | Mensaje al usuario |
|---|---|
| 400 | "La solicitud no es válida." |
| 401 | "Tu sesión ha expirado. Inicia sesión nuevamente." |
| 403 | "Necesitas dar permiso de cámara primero." |
| 404 | (varía: lista vacía o "no encontrado") |
| 415 | "El formato de la imagen no es compatible (JPEG o PNG)." |
| 422 | Mensaje del back ("No se detectó ningún rostro", "Más de un rostro", etc.) |
| 429 | "Has alcanzado el límite de solicitudes. Espera un momento." |
| 502 | "El servicio no está disponible todavía." |
| 503 | "El servicio se está configurando." |
| 504 | "El servicio tardó demasiado. Intenta de nuevo." |

## 6. Flujo de análisis de ánimo

El flujo completo está en `Recommendations.tsx` y usa `useCamera`, `useEmotionDetection`, `emotionService` e `historyService`.

1. Usuario hace clic en "Analizar mi ánimo"
2. Se muestra CameraPermission ("¿Podemos ver tu rostro un instante?")
   - Si el usuario cancela → DELETE /consent (revoca consentimiento) y vuelve a idle
   - Si acepta → PUT /consent (si no existía) y pasa a CameraView
3. CameraView enciende la cámara (getUserMedia)
4. Usuario hace clic en "Capturar y analizar"
   - useCamera captura un frame a Blob JPEG
   - emotionService.analyzeEmotion(blob) → POST /emotions/analyze (multipart)
   - El back responde { suggestedExpression, confidence, faces, reason }
5. EmotionResult muestra la emoción y pregunta "¿Película o serie?"
6. Usuario confirma:
   - useEmotionDetection.saveWithEmotion(emoción) → POST /emotions/history con { mood, confidence?, time_zone }
     (sin imagen: la foto solo viaja una vez, a /analyze; confidence se envía solo si se confirmó la sugerencia)
   - GET /recommendations?mood=<emoción>&media_type=<movie|tv>&limit=1
   - PUT /history/:id/recommendations/:media_type/:tmdb_id → guarda la recomendación
7. Se muestra la recomendación única y se refresca la lista histórica

Privacidad: la imagen se envía **una sola vez** al backend (`/analyze`), que la procesa con AWS Rekognition y no la persiste. El frontend no guarda la imagen en ningún lado (ni en localStorage, ni en IndexedDB). Solo se persiste la emoción detectada y la recomendación asociada.

Consentimiento: se pide una vez y se guarda en camera_consents (back). Si el usuario cancela en el CameraPermission, se revoca con DELETE /consent. El navegador mantiene su propio permiso de cámara (no se puede revocar desde la app).

## 7. Historial emocional y Dashboard

`useMoodHistory({ period })` o `useMoodHistory({ year })` carga `GET /api/v1/emotions/history` y devuelve `HistoryEntry[]`. `useMoodSummary(period)` carga `GET /api/v1/emotions/summary`. Los consumen:

- **`History.tsx`**: pide el año completo que se está mirando (`?year=YYYY`) y muestra un heatmap anual (estilo GitHub) con un color por día según la emoción primaria. Al hacer clic en un día, `DayDetail` muestra la emoción, la hora y las recomendaciones guardadas de ese día.
- **`Dashboard.tsx`**: usa el resumen del backend (`useMoodSummary`) para las gráficas de Recharts (distribución en PieChart, evolución por día o por mes en LineChart), los días con registro, la emoción predominante, las recomendaciones recientes y **qué tipo de contenido se recomendó** (géneros más frecuentes y películas frente a series).
- **`Recommendations.tsx`**: lista plana de recomendaciones históricas, con fecha + emoción como etiqueta.

**Limitación conocida del back:** el esquema permite una detección por usuario y día (una nueva detección el mismo día reemplaza la anterior). El frontend asume esto: cada `HistoryEntry` es un día, no un evento individual.

El Dashboard ya no calcula en el navegador: cada cambio de período (`7d`, `30d`, `Este año`) vuelve a pedir `GET /api/v1/emotions/summary?period=...`.

**Emociones:** el contrato son los siete códigos del backend (`HAPPY`, `SAD`, `ANGRY`, `FEAR`, `DISGUSTED`, `SURPRISED`, `CALM`). `src/lib/emotions.ts` los traduce a claves internas, etiquetas y colores; `moodLabel()` devuelve la etiqueta en español de un código.

## 8. Favoritos

`favoritesService` mantiene la API pública (`getFavorites`, `isFavorite`, `addFavorite`, `removeFavorite`, `toggleFavorite`) pero internamente usa el backend:

- `GET /api/v1/library/favorites` para leer.
- `PUT /api/v1/library/favorites/:media_type/:tmdb_id` para agregar.
- `DELETE /api/v1/library/favorites/:media_type/:tmdb_id` para quitar.
- **Caché en memoria** (`cachedFavorites` + `cachePromise`) para que múltiples componentes no disparen N+1 en paralelo. La caché se invalida con `FAVORITES_CHANGED_EVENT` después de cada `PUT`/`DELETE`.
- **N+1 a `/api/v1/media/:media_type/:tmdb_id`** para resolver `tmdb_id` → `Movie` (título, póster, overview, etc.).

`FavoriteButton` usa un **delay aleatorio (100-300ms)** antes de verificar el estado, para no saturar el Gateway cuando hay muchas cards en pantalla. Tiene `optimistic update`: cambia el ícono antes de que el `PUT`/`DELETE` termine y revierte si falla.

## 9. Decisiones técnicas destacadas

1. `VITE_API_URL` solo contiene el origen. Los servicios agregan `/api/v1/...`. Evita duplicar el prefijo si mañana cambia el path base.
2. Todas las llamadas pasan por `src/services/`. Los componentes no hacen `fetch`. Esto permite cambiar el backend (o mockearlo) sin tocar componentes.
3. El frontend nunca envía `user_id` ni `profile_id`. El backend toma el usuario del JWT. Si un servicio necesita el usuario, lo obtiene del token.
4. El frontend nunca ve claves privadas. TMDB, AWS y `DATABASE_URL` viven solo en el back. El front solo conoce `VITE_API_URL` y las claves públicas de Supabase.
5. La imagen de la cámara no se persiste. Se envía al back, se procesa con Rekognition y se descarta. El front no la guarda en ningún lado.
6. Caché de favoritos en memoria. Sin caché, cada card dispara un `GET /favorites` + N+1, lo que produce 429. Con caché, la primera card hace el fetch y las demás leen de memoria.
7. N+1 controlado en favoritos. El back devuelve solo `tmdb_id` + `media_type`. El front resuelve los detalles con `getMediaDetails`. Es aceptable para el volumen esperado (decenas de favoritos por usuario).
8. Heatmap con scroll horizontal en mobile. El calendario anual no entra en 375px. Se renderiza con `min-w-[900px]` y scroll horizontal, más un gradiente en el borde derecho que sugiere que hay más contenido.
9. Lazy loading de páginas. `AppRoutes.tsx` usa `React.lazy` + `Suspense` para cargar cada página en su propio chunk. El bundle inicial baja de ~985 kB a ~300 kB.
10. Consentimiento de cámara persistente. Se pide una vez y se guarda en el back (`camera_consents`). Se revoca si el usuario cancela en `CameraPermission`. El navegador mantiene su propio permiso (no se puede revocar desde la app).

## 10. Identidad visual

**Concepto:** plataforma cinematográfica moderna, elegante y cálida, que conecta películas con emociones. Estética oscura inspirada en salas de cine. No replica la identidad de plataformas existentes.

### Paleta

| Color | Código | Uso |
|---|---|---|
| Negro cálido | `#0f0b09` | Fondo principal (`--background`) |
| Verde profundo | `#0e2520` | Superficies y secciones (`--secondary`) |
| Verde petróleo | `#1f5656` | Color protagonista (`--primary`) |
| Terracota | `#dd6122` | Acentos (`--accent`) |
| Óxido | `#781d0d` | Estados destructivos (`--destructive`) |
| Marrón tierra | `#6d523e` | Superficies secundarias |
| Oliva grisáceo | `#7c8075` | Texto secundario (`--muted-foreground`) |

Todas las variables viven en `src/index.css` y se consumen vía Tailwind (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-accent`, etc.). No hay colores hardcodeados en los componentes.

### Tipografía

Outfit (Fontsource). Jerarquía:

- Títulos: `font-black` (900), `tracking-tight`, `title-poster` para héroes.
- Subtítulos: `font-bold` (700-800).
- Botones/etiquetas: `font-semibold` (600-700).
- Cuerpo: `font-normal` / `font-medium` (400-500).

### Componentes y utilidades clave

- `.surface-card`: superficie con gradiente, borde sutil y sombra profunda. Usada en todas las cards.
- `.surface-card-hover`: agrega hover con borde terracota y sombra.
- `.eyebrow`: texto chico, mayúsculas, `tracking-widest`, color terracota. Usado arriba de los títulos.
- `.title-poster`: título grande, `font-black`, `tracking-tight`, `leading-none`, mayúsculas.
- `.sidebar-surface`: gradiente vertical para el sidebar.
- `prefers-reduced-motion` respetado en animaciones de Motion.

## 11. Scripts

```bash
npm install          # Instalar dependencias
npm run dev          # Servidor de desarrollo (Vite)
npm run build        # Build de producción (tsc + vite build)
npm run lint         # ESLint
npm run preview      # Preview del build
npm run test:e2e     # Pruebas E2E con Playwright (ver e2e/README.md)
npm run test:e2e:ui  # Pruebas E2E en modo interactivo

### Pruebas E2E e integración continua

Tres flujos de usuario se prueban de punta a punta con Playwright en un Chromium real, con cámara simulada y el backend y Supabase simulados con el mismo contrato que el backend real:

1. **Acceso y catálogo:** sin sesión redirige al login (Google/GitHub); con sesión muestra el catálogo y el detalle, sin llamar a TMDB desde el navegador.
2. **Ánimo y recomendación:** consentimiento → cámara → análisis → confirmación → recomendación acorde al ánimo; verifica que la foto viaja una sola vez y que cancelar no enciende la cámara.
3. **Favoritos y tablero:** guardar un favorito, verlo en "Mis favoritos" y comprobar el resumen del tablero por período.

Detalles, cómo ejecutarlas y qué cubren: [`e2e/README.md`](e2e/README.md). GitHub Actions (`.github/workflows/ci.yml`) ejecuta lint, verificación de tipos, build y estas pruebas en cada push y pull request.

## 12. Cómo levantar el proyecto

1. Clonar e instalar:
   git clone <repo>
   cd butaca.frontend
   npm install

2. Configurar variables de entorno:
   cp .env.example .env
   (Editar .env con VITE_API_URL y las claves de Supabase)

3. Levantar el frontend:
   npm run dev
   Abrir http://localhost:5173

4. (Opcional) Levantar el backend:
   En otra terminal, desde butaca-backend:
   docker compose up --build -d
   Verificar: curl -i http://127.0.0.1:8080/health/live

Requisitos: Node 20+, backend corriendo en http://localhost:8080 (o el origen configurado en VITE_API_URL).

## 13. Notas para contribuir

- No hacer `fetch` directo en componentes. Usar `src/services/`.
- No hardcodear colores. Usar las variables de `index.css` (`bg-background`, `text-accent`, etc.).
- No enviar `user_id` ni `profile_id` al back. El back toma el usuario del JWT.
- No exponer claves privadas en el front. TMDB, AWS y `DATABASE_URL` viven solo en el back.
- No persistir imágenes de cámara. Solo la emoción detectada y la recomendación asociada.
- Correr `npm run build` y `npm run lint` antes de cada PR.
- Si se agrega un endpoint nuevo, crear la función en `src/services/` (no en el componente) y documentar el contrato en este README.