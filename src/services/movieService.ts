
const API_URL = import.meta.env.VITE_API_URL;

export type MediaType = "all" | "movie" | "tv";

export interface Movie {
  id: number | string;
  title: string;
  poster_path?: string | null;
  media_type?: string;
  overview?: string;
  release_date?: string | null;
  vote_average?: number | null;
  genre_ids?: number[];
}

export interface MediaResponse {
  page: number;
  results: Movie[];
  total_pages?: number;
  total_results?: number;
}

export interface Genre {
  id: number;
  name: string;
  media_types: string[];
}

export interface MediaDetails extends Movie {
  genres?: Genre[];
  runtime?: number | null;
  backdrop_path?: string | null;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

interface MediaOptions {
  media_type?: MediaType;
  page?: number;
  language?: string;
}

function buildParams(
  options: Record<string, string | number | undefined>
): string {
  const params = new URLSearchParams();

  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

async function apiGet<T>(
  endpoint: string,
  params?: string
): Promise<T> {
  if (!API_URL) {
    throw new Error("No se configuró VITE_API_URL.");
  }

  const base = API_URL.replace(/\/$/, "");
  const url = `${base}${endpoint}${params ? `?${params}` : ""}`;

  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error(
      "No se pudo conectar con el API Gateway. Verifica que el backend esté encendido."
    );
  }

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);

    let message = `Error del servidor: ${response.status}`;

    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      message = data.error;
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// Películas y series en tendencia.
export async function getTrending(
  language = "es-MX"
): Promise<MediaResponse> {
  return apiGet<MediaResponse>(
    "/api/v1/media/trending",
    buildParams({ language })
  );
}

// Películas y series populares.
export async function getPopular(
  options: MediaOptions = {}
): Promise<MediaResponse> {
  const {
    media_type = "all",
    page = 1,
    language = "es-MX",
  } = options;

  return apiGet<MediaResponse>(
    "/api/v1/media/popular",
    buildParams({ media_type, page, language })
  );
}

// Buscar películas y series.
export async function searchMedia(
  query: string,
  options: MediaOptions = {}
): Promise<MediaResponse> {
  const normalizedQuery = query.trim();

  if (
    normalizedQuery.length < 1 ||
    normalizedQuery.length > 100
  ) {
    throw new Error(
      "La búsqueda debe tener entre 1 y 100 caracteres."
    );
  }

  const {
    media_type = "all",
    page = 1,
    language = "es-MX",
  } = options;

  return apiGet<MediaResponse>(
    "/api/v1/media/search",
    buildParams({
      query: normalizedQuery,
      media_type,
      page,
      language,
    })
  );
}

// Obtener géneros.
export async function getGenres(
  media_type: MediaType = "all",
  language = "es-MX"
): Promise<{ genres: Genre[] }> {
  return apiGet<{ genres: Genre[] }>(
    "/api/v1/media/genres",
    buildParams({ media_type, language })
  );
}

// Obtener detalles de una película o serie.
export async function getMediaDetails(
  id: number | string,
  mediaType: "movie" | "tv" = "movie",
  language = "es-MX"
): Promise<MediaDetails> {
  return apiGet<MediaDetails>(
    `/api/v1/media/${mediaType}/${encodeURIComponent(String(id))}`,
    buildParams({ language })
  );
}

// Compatibilidad con el componente Home existente.
export const getTrendingMovies = getTrending;

export async function getPopularMovies(
  page = 1,
  language = "es-MX"
): Promise<MediaResponse> {
  return getPopular({ media_type: "movie", page, language });
}

export async function getPopularSeries(
  page = 1,
  language = "es-MX"
): Promise<MediaResponse> {
  return getPopular({ media_type: "tv", page, language });
}