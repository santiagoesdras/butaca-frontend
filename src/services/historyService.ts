import { supabase } from "./supabase";
import type {
  HistoryEntry,
  HistoryResponse,
  MoodCode,
  MoodSummary,
  SavedMoodResponse,
  SummaryPeriod,
} from "@/types/history";

const API_URL = import.meta.env.VITE_API_URL;

export type HistoryPeriod = "7d" | "30d";

/** Un período reciente (7d/30d) o un año calendario completo (para el mapa anual). */
export type HistoryRange = { period: HistoryPeriod } | { year: number };

async function getToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("No se pudo obtener la sesión.");
  const token = data.session?.access_token;
  if (!token) throw new Error("Debes iniciar sesión para consultar tu historial.");
  return token;
}

function baseUrl(): string {
  if (!API_URL) throw new Error("No se configuró VITE_API_URL.");
  return API_URL.replace(/\/$/, "");
}

/** Zona horaria IANA del navegador; define el día local de cada registro. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/* ------------------------------------------------------------------ */
/* GET /api/v1/emotions/history?period=7d|30d  ó  ?year=YYYY           */
/* ------------------------------------------------------------------ */

export async function getHistory(range: HistoryRange | HistoryPeriod = { period: "30d" }): Promise<HistoryEntry[]> {
  const token = await getToken();
  const query = typeof range === "string"
    ? `period=${range}`
    : "year" in range ? `year=${range.year}` : `period=${range.period}`;
  const url = `${baseUrl()}/api/v1/emotions/history?${query}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error("No se pudo conectar con el servicio de historial.");
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error("Tu sesión ha expirado.");
    if (response.status === 404) return [];
    throw new Error(`Error del servidor: ${response.status}`);
  }

  const data = (await response.json()) as HistoryResponse | HistoryEntry[];
  return Array.isArray(data) ? data : data.results ?? [];
}

/* ------------------------------------------------------------------ */
/* GET /api/v1/emotions/summary?period=7d|30d|year                     */
/* ------------------------------------------------------------------ */

export async function getSummary(period: SummaryPeriod = "30d"): Promise<MoodSummary> {
  const token = await getToken();
  const url = `${baseUrl()}/api/v1/emotions/summary?period=${period}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error("No se pudo conectar con el servicio de historial.");
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error("Tu sesión ha expirado.");
    throw new Error(`Error del servidor: ${response.status}`);
  }

  return (await response.json()) as MoodSummary;
}

/* ------------------------------------------------------------------ */
/* POST /api/v1/emotions/history                                       */
/* Guarda la emoción CONFIRMADA por el usuario. La imagen ya no se     */
/* vuelve a enviar: solo pasó una vez por /analyze.                    */
/* ------------------------------------------------------------------ */

export async function saveMood(
  mood: MoodCode,
  confidence: number | null,
  timeZone: string = browserTimeZone()
): Promise<SavedMoodResponse> {
  const token = await getToken();
  const url = `${baseUrl()}/api/v1/emotions/history`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        confidence === null ? { mood, time_zone: timeZone } : { mood, confidence, time_zone: timeZone }
      ),
    });
  } catch {
    throw new Error("No se pudo conectar con el servicio de historial.");
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error("Tu sesión ha expirado.");
    if (response.status === 403) throw new Error("Necesitas dar permiso de cámara primero.");
    if (response.status === 400) {
      const body = await response.json().catch(() => null);
      if (body && typeof body === "object" && "error" in body) throw new Error(String(body.error));
      throw new Error("No se pudo guardar la emoción.");
    }
    throw new Error(`Error del servidor: ${response.status}`);
  }

  return (await response.json()) as SavedMoodResponse;
}

/* ------------------------------------------------------------------ */
/* PUT /api/v1/emotions/history/:id/recommendations/:media_type/:tmdb_id */
/* ------------------------------------------------------------------ */

export interface RecommendationPayload {
  title: string;
  poster_path: string | null;
  overview: string | null;
  release_date: string | null;
  vote_average: number | null;
  genre_ids: number[];
}

export async function saveRecommendationForDay(
  historyId: string,
  mediaType: "movie" | "tv",
  tmdbId: number,
  data: RecommendationPayload
): Promise<void> {
  const token = await getToken();
  const url = `${baseUrl()}/api/v1/emotions/history/${historyId}/recommendations/${mediaType}/${tmdbId}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("No se pudo conectar con el servicio de historial.");
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error("Tu sesión ha expirado.");
    throw new Error(`Error al guardar la recomendación: ${response.status}`);
  }
}

/* ------------------------------------------------------------------ */
/* Consentimiento persistente (camera_consents)                        */
/* ------------------------------------------------------------------ */

const CONSENT_POLICY_VERSION = "1.0";

export async function grantCameraConsent(): Promise<void> {
  const token = await getToken();
  const url = `${baseUrl()}/api/v1/emotions/consent`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ policy_version: CONSENT_POLICY_VERSION }),
  });
  if (!response.ok) throw new Error(`Error al guardar consentimiento: ${response.status}`);
}

export async function getCameraConsent(): Promise<boolean> {
  const token = await getToken();
  const url = `${baseUrl()}/api/v1/emotions/consent`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return false;
  const data = (await response.json()) as { granted?: boolean };
  return data.granted === true;
}

/** Revoca el consentimiento persistente (DELETE /consent). */
export async function revokeCameraConsent(): Promise<void> {
  const token = await getToken();
  const url = `${baseUrl()}/api/v1/emotions/consent`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Error al revocar consentimiento: ${response.status}`);
}
