
import type { Movie } from "./movieService";
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL;

export interface Recommendation extends Movie {
  score?: number;
  reasons?: string[];
}

export interface RecommendationsResponse {
  results: Recommendation[];
  based_on: {
    favorites: number;
    watchlist: number;
    progress: number;
  };
}

export interface RecommendationOptions {
  media_type?: "all" | "movie" | "tv";
  language?: string;
  limit?: number;
  mood?: string;
}

export async function getRecommendations(
  options: RecommendationOptions = {}
): Promise<Movie[]> {
  if (!API_URL) {
    throw new Error("No se configuró VITE_API_URL.");
  }

  const { data, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("No se pudo obtener la sesión.");
  }

  const token = data.session?.access_token;

  if (!token) {
    throw new Error(
      "Debes iniciar sesión para consultar recomendaciones."
    );
  }

  const {
    media_type = "all",
    language = "es-MX",
    limit = 20,
    mood
  } = options;

  if (!Number.isInteger(limit) || limit < 1 || limit > 40) {
    throw new Error("El límite debe estar entre 1 y 40.");
  }

  const params = new URLSearchParams({
    media_type,
    language,
    limit: String(limit),
  });
  if (mood) params.set("mood", mood);

  const url =
    `${API_URL.replace(/\/$/, "")}` +
    `/api/v1/recommendations?${params.toString()}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el servicio de recomendaciones."
    );
  }

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
        }

        if (response.status === 502) {
            throw new Error(
            "El servicio de recomendaciones no está disponible todavía. Vuelve a intentarlo más tarde."
            );
        }

        if (response.status === 503) {
            throw new Error(
            "El servicio de recomendaciones se está configurando. Inténtalo de nuevo en unos minutos."
            );
        }

        if (response.status === 504) {
            throw new Error(
            "El servicio de recomendaciones no respondió a tiempo. Inténtalo más tarde."
            );
        }

        const result: unknown = await response.json().catch(() => null);

        let message = `Error del servidor: ${response.status}`;

        if (
            typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
        ) { message = result.error; }
        throw new Error(message);
    }

  const result =
    (await response.json()) as RecommendationsResponse;

  return result.results;
}
