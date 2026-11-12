import type { Page, Route } from "@playwright/test";

/**
 * Backend y Supabase simulados para las pruebas E2E.
 *
 * Intercepta en el navegador las llamadas al Gateway (VITE_API_URL) y a Supabase Auth, y responde con
 * el mismo contrato que el backend real (rutas, formas JSON y códigos). Guarda estado en memoria
 * (favoritos, consentimiento, historial) y registra cada petición para que las pruebas verifiquen
 * qué envió el frontend. Así los flujos se prueban de punta a punta en un navegador real, sin
 * credenciales ni servicios externos, y pueden correr en CI.
 */

export const API_URL = "http://api.butaca.test";
export const SUPABASE_URL = "https://e2e.supabase.co";
/** supabase-js guarda la sesión en localStorage con la clave sb-<ref del proyecto>-auth-token. */
const STORAGE_KEY = "sb-e2e-auth-token";

export const USER = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "majo@butaca.test",
  name: "Majo",
};

type MediaType = "movie" | "tv";
type Mood = "HAPPY" | "SAD" | "ANGRY" | "FEAR" | "DISGUSTED" | "SURPRISED" | "CALM";

interface Media {
  id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string | null;
  vote_average: number | null;
  genre_ids: number[];
}

const MOOD_NAMES: Record<Mood, string> = {
  HAPPY: "Felicidad", SAD: "Tristeza", ANGRY: "Enojo", FEAR: "Miedo",
  DISGUSTED: "Desagrado", SURPRISED: "Sorpresa", CALM: "Neutralidad / calma",
};
const MOODS = Object.keys(MOOD_NAMES) as Mood[];

const GENRES = [
  { id: 16, name: "Animación", media_types: ["movie", "tv"] },
  { id: 18, name: "Drama", media_types: ["movie", "tv"] },
  { id: 35, name: "Comedia", media_types: ["movie", "tv"] },
  { id: 878, name: "Ciencia ficción", media_types: ["movie"] },
  { id: 10751, name: "Familia", media_types: ["movie", "tv"] },
];

const media = (id: number, media_type: MediaType, title: string, genre_ids: number[], extra: Partial<Media> = {}): Media => ({
  id, media_type, title, poster_path: null, overview: `Sinopsis de ${title}.`, release_date: "2020-01-01",
  vote_average: 7.5, genre_ids, ...extra,
});

export const CATALOG: Media[] = [
  media(354912, "movie", "Coco", [16, 10751], { release_date: "2017-10-27", vote_average: 8.2, overview: "Miguel sueña con ser músico." }),
  media(438631, "movie", "Duna", [878], { release_date: "2021-09-15" }),
  media(1396, "tv", "Breaking Bad", [18]),
  media(2490, "tv", "The IT Crowd", [35]),
  media(105, "movie", "Volver al futuro", [878, 35]),
];

interface HistoryEntry {
  id: string;
  date: string;
  mood: Mood;
  name: string;
  confidence: number | null;
  source: "AWS_REKOGNITION" | "USER_SELECTED";
  scores: { mood: Mood; confidence: number }[];
  detected_at: string;
  recommendations: (Pick<Media, "title" | "poster_path" | "release_date" | "vote_average" | "genre_ids"> & {
    tmdb_id: number; media_type: MediaType; overview: string | null; saved_at: string;
  })[];
}

export interface RecordedRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  headers: Record<string, string>;
  body: string | null;
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
};

function fakeJwt(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  return `${encode({ alg: "ES256", typ: "JWT" })}.${encode({
    sub: USER.id, email: USER.email, aud: "authenticated", role: "authenticated",
    iss: `${SUPABASE_URL}/auth/v1`, iat: now, exp: now + 3600,
  })}.firma-e2e`;
}

const today = () => new Date().toISOString().slice(0, 10);

export class FakeButaca {
  readonly requests: RecordedRequest[] = [];
  readonly favorites = new Map<string, { tmdb_id: number; media_type: MediaType; created_at: string }>();
  readonly history: HistoryEntry[] = [];
  consent = false;
  /** Lo que devolverá POST /api/v1/emotions/analyze. */
  analysis: { suggestedExpression: Mood | null; confidence: number | null; reason: string | null } = {
    suggestedExpression: "SAD", confidence: 91.2, reason: null,
  };

  /** Historial previo, para los flujos que parten de datos existentes. */
  seedHistory(entries: { date: string; mood: Mood; recommendation?: Media }[]) {
    for (const [index, { date, mood, recommendation }] of entries.entries()) {
      this.history.push({
        id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        date, mood, name: MOOD_NAMES[mood], confidence: 90, source: "AWS_REKOGNITION",
        scores: [{ mood, confidence: 90 }], detected_at: `${date}T20:00:00.000Z`,
        recommendations: recommendation ? [{
          tmdb_id: recommendation.id, media_type: recommendation.media_type, title: recommendation.title,
          poster_path: recommendation.poster_path, overview: recommendation.overview, release_date: recommendation.release_date,
          vote_average: recommendation.vote_average, genre_ids: recommendation.genre_ids, saved_at: `${date}T20:05:00.000Z`,
        }] : [],
      });
    }
  }

  /** Peticiones al Gateway con un método y una ruta exactos. */
  calls(method: string, path: string) {
    return this.requests.filter((request) => request.method === method && request.path === path);
  }

  /** Instala las rutas simuladas. Con `signedIn` la página arranca con una sesión de Supabase. */
  async install(page: Page, { signedIn = true } = {}) {
    if (signedIn) {
      const session = {
        access_token: fakeJwt(), refresh_token: "refresh-e2e", token_type: "bearer", expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: USER.id, aud: "authenticated", role: "authenticated", email: USER.email,
          user_metadata: { full_name: USER.name }, app_metadata: { provider: "google" } },
      };
      await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(session)]);
    }
    await page.route(`${SUPABASE_URL}/**`, (route) => this.supabase(route));
    await page.route(`${API_URL}/**`, (route) => this.gateway(route));
  }

  private async supabase(route: Route) {
    const url = new URL(route.request().url());
    if (url.pathname === "/auth/v1/authorize") {
      // El inicio de sesión real con Google o GitHub ocurre fuera de la app; aquí solo se verifica la redirección.
      return route.fulfill({ status: 200, contentType: "text/html", body: "<h1>Proveedor OAuth simulado</h1>" });
    }
    if (url.pathname === "/auth/v1/user") {
      return route.fulfill({ status: 200, headers: CORS, json: { id: USER.id, email: USER.email, aud: "authenticated" } });
    }
    if (url.pathname === "/auth/v1/logout") return route.fulfill({ status: 204, headers: CORS });
    return route.fulfill({ status: 200, headers: CORS, json: {} });
  }

  private async gateway(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });

    const body = request.postData();
    this.requests.push({ method, path: url.pathname, query: url.searchParams, headers: request.headers(), body });
    const json = (status: number, payload?: unknown) =>
      route.fulfill({ status, headers: CORS, ...(payload === undefined ? {} : { json: payload }) });

    const path = url.pathname;
    const isPrivate = /^\/api\/v1\/(library|emotions|recommendations)/.test(path);
    if (isPrivate && !request.headers()["authorization"]?.startsWith("Bearer ")) {
      return json(401, { error: "Se requiere Authorization: Bearer <access_token>" });
    }

    // ── Media (público) ──
    if (method === "GET" && path === "/api/v1/media/trending") return json(200, { page: 1, results: CATALOG });
    if (method === "GET" && path === "/api/v1/media/popular") {
      const type = url.searchParams.get("media_type");
      const results = CATALOG.filter((item) => type === "all" || item.media_type === type);
      return json(200, { page: 1, total_pages: 1, total_results: results.length, results });
    }
    if (method === "GET" && path === "/api/v1/media/genres") return json(200, { genres: GENRES });
    const detail = path.match(/^\/api\/v1\/media\/(movie|tv)\/(\d+)$/);
    if (method === "GET" && detail) {
      const item = CATALOG.find((entry) => entry.media_type === detail[1] && entry.id === Number(detail[2]));
      if (!item) return json(404, { error: "Contenido no encontrado" });
      return json(200, { ...item, original_title: item.title, tagline: null, status: "Released", backdrop_path: null,
        genres: GENRES.filter((genre) => item.genre_ids.includes(genre.id)).map(({ id, name }) => ({ id, name })),
        vote_count: 1000, runtime: 105 });
    }

    // ── Library: favoritos, watchlist y progreso ──
    if (method === "GET" && path === "/api/v1/library/favorites") return json(200, { results: [...this.favorites.values()] });
    const favorite = path.match(/^\/api\/v1\/library\/favorites\/(movie|tv)\/(\d+)$/);
    if (favorite && method === "PUT") {
      const key = `${favorite[1]}:${favorite[2]}`;
      if (!this.favorites.has(key)) {
        this.favorites.set(key, { tmdb_id: Number(favorite[2]), media_type: favorite[1] as MediaType, created_at: new Date().toISOString() });
      }
      return json(200, this.favorites.get(key));
    }
    if (favorite && method === "DELETE") {
      this.favorites.delete(`${favorite[1]}:${favorite[2]}`);
      return json(204);
    }
    if (method === "GET" && (path === "/api/v1/library/watchlist" || path === "/api/v1/library/progress")) return json(200, { results: [] });

    // ── Emociones ──
    if (path === "/api/v1/emotions/consent") {
      if (method === "PUT") this.consent = true;
      if (method === "DELETE") { this.consent = false; return json(204); }
      return json(200, { granted: this.consent, policy_version: this.consent ? "1.0" : null, granted_at: null });
    }
    if (method === "POST" && path === "/api/v1/emotions/analyze") {
      if (!request.headers()["content-type"]?.startsWith("multipart/form-data")) return json(415, { error: "Se requiere multipart/form-data" });
      return json(200, { ...this.analysis, confirmationRequired: true, faces: 1 });
    }
    if (method === "POST" && path === "/api/v1/emotions/history") return this.recordMood(body, json);
    if (method === "GET" && path === "/api/v1/emotions/history") {
      const year = url.searchParams.get("year");
      return json(200, { results: this.history.filter((entry) => !year || entry.date.startsWith(year)) });
    }
    if (method === "GET" && path === "/api/v1/emotions/summary") return json(200, this.summary(url.searchParams.get("period") ?? "30d"));
    const saved = path.match(/^\/api\/v1\/emotions\/history\/([0-9a-f-]{36})\/recommendations\/(movie|tv)\/(\d+)$/);
    if (method === "PUT" && saved) {
      const entry = this.history.find((item) => item.id === saved[1]);
      if (!entry) return json(404, { error: "Registro de emoción no encontrado" });
      const input = JSON.parse(body ?? "{}");
      const recommendation = { ...input, tmdb_id: Number(saved[3]), media_type: saved[2] as MediaType, saved_at: new Date().toISOString() };
      entry.recommendations = [...entry.recommendations.filter((rec) => rec.tmdb_id !== recommendation.tmdb_id), recommendation];
      return json(200, recommendation);
    }

    // ── Recomendaciones ──
    if (method === "GET" && path === "/api/v1/recommendations") {
      const type = url.searchParams.get("media_type") ?? "all";
      const mood = url.searchParams.get("mood");
      const pick = CATALOG.filter((item) => type === "all" || item.media_type === type);
      // Como las reglas reales: con SAD primero lo que más coincide con comedia, animación y familia.
      const uplifting = [35, 16, 10751];
      const matches = (item: Media) => item.genre_ids.filter((genre) => uplifting.includes(genre)).length;
      const ordered = mood === "SAD" ? [...pick].sort((x, y) => matches(y) - matches(x)) : pick;
      return json(200, { results: ordered.map((item) => ({ ...item, score: 0.9, reasons: mood ? ["mood"] : ["popular"] })),
        mood, based_on: { favorites: this.favorites.size, watchlist: 0, progress: 0 } });
    }

    return json(404, { error: "Ruta desconocida" });
  }

  private recordMood(body: string | null, json: (status: number, payload?: unknown) => Promise<void>) {
    if (!this.consent) return json(403, { error: "Se requiere el consentimiento para usar la cámara" });
    const input = JSON.parse(body ?? "{}") as { mood?: Mood; confidence?: number | null; time_zone?: string };
    const allowed = ["mood", "confidence", "time_zone"];
    const extra = Object.keys(input).filter((key) => !allowed.includes(key));
    if (extra.length) return json(400, { error: "Campos no admitidos: " + extra.join(", ") });
    if (!input.mood || !MOODS.includes(input.mood)) return json(400, { error: "mood debe ser " + MOODS.join(", ") });
    const date = today();
    const existing = this.history.find((entry) => entry.date === date);
    const confidence = input.confidence ?? null;
    const entry: HistoryEntry = {
      id: existing?.id ?? "00000000-0000-4000-8000-0000000000ff", date, mood: input.mood, name: MOOD_NAMES[input.mood],
      confidence, source: confidence === null ? "USER_SELECTED" : "AWS_REKOGNITION",
      scores: confidence === null ? [] : [{ mood: input.mood, confidence }], detected_at: new Date().toISOString(),
      recommendations: existing?.recommendations ?? [],
    };
    if (existing) this.history.splice(this.history.indexOf(existing), 1, entry);
    else this.history.push(entry);
    return json(existing ? 200 : 201, { ...entry, replaced: !!existing });
  }

  /** Mismo cálculo que GET /api/v1/emotions/summary en el backend. */
  private summary(period: string) {
    const to = new Date(`${today()}T00:00:00.000Z`);
    const from = period === "year" ? new Date(`${today().slice(0, 4)}-01-01T00:00:00.000Z`)
      : new Date(to.getTime() - ((period === "7d" ? 7 : 30) - 1) * 86400000);
    const entries = this.history.filter((entry) => entry.date >= from.toISOString().slice(0, 10) && entry.date <= today());
    const zero = () => Object.fromEntries(MOODS.map((mood) => [mood, 0])) as Record<Mood, number>;
    const counts = zero();
    entries.forEach((entry) => { counts[entry.mood] += 1; });
    const distribution = MOODS.map((mood) => ({ mood, name: MOOD_NAMES[mood], count: counts[mood] }));
    const top = [...distribution].sort((a, b) => b.count - a.count)[0];
    const buckets = new Map<string, Record<Mood, number>>();
    if (period === "year") {
      for (let month = 1; month <= 12; month++) buckets.set(`${today().slice(0, 4)}-${String(month).padStart(2, "0")}`, zero());
    } else {
      for (let time = from.getTime(); time <= to.getTime(); time += 86400000) buckets.set(new Date(time).toISOString().slice(0, 10), zero());
    }
    entries.forEach((entry) => {
      const bucket = buckets.get(period === "year" ? entry.date.slice(0, 7) : entry.date);
      if (bucket) bucket[entry.mood] += 1;
    });
    const saved = entries.flatMap((entry) => entry.recommendations.map((rec) => ({ ...rec, mood: entry.mood, mood_name: entry.name, date: entry.date })));
    const byGenre = new Map<number, number>();
    saved.forEach((rec) => rec.genre_ids.forEach((genre) => byGenre.set(genre, (byGenre.get(genre) ?? 0) + 1)));
    return {
      period, from: from.toISOString().slice(0, 10), to: today(),
      total_records: entries.length, days_with_records: new Set(entries.map((entry) => entry.date)).size,
      predominant: top.count > 0 ? top : null, distribution,
      timeline: [...buckets].map(([bucket, moodCounts]) => ({ bucket, counts: moodCounts })),
      recommendations: {
        total: saved.length,
        by_media_type: { movie: saved.filter((rec) => rec.media_type === "movie").length, tv: saved.filter((rec) => rec.media_type === "tv").length },
        by_mood: MOODS.map((mood) => ({ mood, name: MOOD_NAMES[mood], count: saved.filter((rec) => rec.mood === mood).length })),
        by_genre: [...byGenre].map(([genre_id, count]) => ({ genre_id, count })).sort((a, b) => b.count - a.count),
        recent: saved.sort((a, b) => b.saved_at.localeCompare(a.saved_at)).slice(0, 5),
      },
    };
  }
}
