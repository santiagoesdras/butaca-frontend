
import { useEffect, useState } from "react";
import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";

import type { Movie, MediaDetails } from "@/services/movieService";
import { getMediaDetails } from "@/services/movieService";

interface MovieDetailsProps {
  movie: Movie;
  onClose: () => void;
}

export default function MovieDetails({
  movie,
  onClose,
}: MovieDetailsProps) {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDetails() {
      setLoading(true);
      setError(null);
      setDetails(null);

      try {
        const result = await getMediaDetails(
          movie.id,
          movie.media_type === "tv" ? "tv" : "movie"
        );

        if (active) {
          setDetails(result);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los detalles."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      active = false;
    };
  }, [movie.id, movie.media_type, reloadKey]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const content = details ?? movie;

  const posterUrl = content.poster_path
    ? content.poster_path.startsWith("http")
      ? content.poster_path
      : `https://image.tmdb.org/t/p/w500${content.poster_path}`
    : null;

  const mediaType =
    content.media_type === "tv" || movie.media_type === "tv"
      ? "Serie"
      : "Película";

  const rating =
    typeof content.vote_average === "number"
      ? content.vote_average.toFixed(1)
      : "Sin calificación";

  const genres = details?.genres?.map((genre) => genre.name).join(", ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-details-title"
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#1f5656] bg-[#0f0b09] p-6 text-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalles"
          className="absolute right-4 top-4 z-10 rounded-full bg-[#1f5656] px-3 py-2 text-white hover:bg-[#dd6122]"
        >
          ✕
        </button>

        <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
          {/*
            La columna del póster se estira a la altura del texto (grilla). La imagen la cubre completa
            (object-cover) para no dejar una franja vacía debajo; mide como mínimo lo de un póster (2:3).
          */}
          <div
            data-testid="details-poster"
            className="relative mx-auto aspect-[2/3] w-full max-w-[220px] overflow-hidden rounded-xl bg-[#0e2520] sm:aspect-auto sm:min-h-[330px] sm:max-w-none"
          >
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`Póster de ${content.title}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-[#7c8075]">
                Póster no disponible
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-sm font-semibold text-[#dd6122]">
                {mediaType}
              </span>

              <h2
                id="movie-details-title"
                className="mt-2 pr-8 text-3xl font-extrabold"
              >
                {content.title}
              </h2>
            </div>

            {loading && (
              <div
                role="status"
                className="flex items-center gap-2 text-[#c5c5c5]"
              >
                <LoaderCircle
                  size={20}
                  className="animate-spin text-[#dd6122]"
                />
                Cargando detalles...
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[#dd6122] p-4"
              >
                <div className="flex items-center gap-2 text-[#dd6122]">
                  <AlertCircle size={20} />
                  <span>No se pudieron actualizar los detalles.</span>
                </div>

                <p className="mt-2 text-sm text-[#c5c5c5]">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => setReloadKey((value) => value + 1)}
                  className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#dd6122]"
                >
                  <RefreshCw size={16} />
                  Reintentar
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-lg bg-[#0e2520] px-3 py-2">
                ★ {rating}
              </span>

              {content.release_date && (
                <span className="rounded-lg bg-[#0e2520] px-3 py-2">
                  {content.release_date.slice(0, 4)}
                </span>
              )}

              {details?.runtime != null && details.runtime > 0 && (
                <span className="rounded-lg bg-[#0e2520] px-3 py-2">
                  {details.runtime} minutos
                </span>
              )}
            </div>

            {genres && (
              <div>
                <h3 className="mb-1 font-bold">Géneros</h3>
                <p className="text-[#c5c5c5]">{genres}</p>
              </div>
            )}

            {details?.number_of_seasons != null && (
              <p className="text-sm text-[#c5c5c5]">
                Temporadas: {details.number_of_seasons}
                {details.number_of_episodes != null &&
                  ` · Episodios: ${details.number_of_episodes}`}
              </p>
            )}

            <div>
              <h3 className="mb-2 text-lg font-bold">
                Sinopsis
              </h3>

              <p className="leading-relaxed text-[#c5c5c5]">
                {content.overview?.trim() ||
                  "No hay una sinopsis disponible para este contenido."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#dd6122] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#b84e19]"
            >
              Volver al catálogo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
