import { supabase } from "./supabase";
import { getMediaDetails, type Movie } from "./movieService";

const API_URL = import.meta.env.VITE_API_URL;

export const FAVORITES_CHANGED_EVENT = "butaca:favorites-changed";

async function getToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("No se pudo obtener la sesión.");
  const token = data.session?.access_token;
  if (!token) throw new Error("Debes iniciar sesión para ver tus favoritos.");
  return token;
}

function baseUrl(): string {
  if (!API_URL) throw new Error("No se configuró VITE_API_URL.");
  return API_URL.replace(/\/$/, "");
}

interface FavoriteRef {
  tmdb_id: number;
  media_type: "movie" | "tv";
  created_at: string;
}

interface FavoritesResponse {
  results: FavoriteRef[];
}

/* ------------------------------------------------------------------ */
/* Caché en memoria                                                    */
/* ------------------------------------------------------------------ */

let cachedFavorites: Movie[] | null = null;
let cachePromise: Promise<Movie[]> | null = null;

/** Invalida la caché y notifica a los listeners. */
function invalidateCache() {
  cachedFavorites = null;
  cachePromise = null;
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}

/* ------------------------------------------------------------------ */
/* Fetch real al backend (N+1)                                         */
/* ------------------------------------------------------------------ */

async function fetchFavoritesFromBackend(): Promise<Movie[]> {
  const token = await getToken();
  const url = `${baseUrl()}/api/v1/library/favorites`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("No se pudo conectar con el servicio de favoritos.");
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error("Tu sesión ha expirado.");
    if (response.status === 404) return [];
    throw new Error(`Error del servidor: ${response.status}`);
  }

  const data = (await response.json()) as FavoritesResponse;
  const refs = data.results ?? [];

  // Resolver cada favorito a un Movie completo (N+1).
  const movies = await Promise.all(
    refs.map(async (ref) => {
      try {
        const details = await getMediaDetails(ref.tmdb_id, ref.media_type);
        return details as Movie;
      } catch {
        return {
          id: ref.tmdb_id,
          media_type: ref.media_type,
          title: `TMDB #${ref.tmdb_id}`,
          poster_path: null,
        } as Movie;
      }
    })
  );

  return movies;
}

/* ------------------------------------------------------------------ */
/* API pública                                                         */
/* ------------------------------------------------------------------ */

/**
 * Devuelve la lista de favoritos con título y póster.
 * Usa caché en memoria: la primera llamada hace el fetch, las siguientes
 * devuelven la caché (o la promesa en vuelo, si están en paralelo).
 * Pasar `force = true` para forzar un refetch.
 */
export async function getFavorites(force = false): Promise<Movie[]> {
  if (!force && cachedFavorites) return cachedFavorites;
  if (!force && cachePromise) return cachePromise;

  cachePromise = fetchFavoritesFromBackend();
  try {
    const data = await cachePromise;
    cachedFavorites = data;
    return data;
  } finally {
    cachePromise = null;
  }
}

/** Verifica si un contenido es favorito (usa la caché). */
export async function isFavorite(
  movie: Pick<Movie, "id" | "media_type">
): Promise<boolean> {
  if (
    !movie.media_type ||
    (movie.media_type !== "movie" && movie.media_type !== "tv")
  ) {
    return false;
  }
  try {
    const favorites = await getFavorites();
    return favorites.some(
      (fav) =>
        String(fav.id) === String(movie.id) &&
        fav.media_type === movie.media_type
    );
  } catch {
    return false;
  }
}

/** Agrega un favorito. */
export async function addFavorite(movie: Movie): Promise<void> {
  if (
    !movie.media_type ||
    (movie.media_type !== "movie" && movie.media_type !== "tv")
  ) {
    throw new Error("El contenido no tiene media_type válido.");
  }
  const token = await getToken();
  const url = `${baseUrl()}/api/v1/library/favorites/${movie.media_type}/${movie.id}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Tu sesión ha expirado.");
    throw new Error(`Error al agregar favorito: ${response.status}`);
  }
  invalidateCache();
}

/** Quita un favorito. */
export async function removeFavorite(
  movie: Pick<Movie, "id" | "media_type">
): Promise<void> {
  if (
    !movie.media_type ||
    (movie.media_type !== "movie" && movie.media_type !== "tv")
  ) {
    throw new Error("El contenido no tiene media_type válido.");
  }
  const token = await getToken();
  const url = `${baseUrl()}/api/v1/library/favorites/${movie.media_type}/${movie.id}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Tu sesión ha expirado.");
    throw new Error(`Error al quitar favorito: ${response.status}`);
  }
  invalidateCache();
}

/** Alterna el estado de favorito. Devuelve el nuevo estado. */
export async function toggleFavorite(movie: Movie): Promise<boolean> {
  const current = await isFavorite(movie);
  if (current) {
    await removeFavorite(movie);
    return false;
  }
  await addFavorite(movie);
  return true;
}