import { useCallback, useEffect, useState } from "react";
import { Heart, LoaderCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

import MovieGrid from "@/components/movies/MovieGrid";
import MovieDetails from "@/components/movies/MovieDetails";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";

import type { Movie } from "@/services/movieService";
import {
  FAVORITES_CHANGED_EVENT,
  getFavorites,
} from "@/services/favoritesService";

export default function Favorites() {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFavorites(force);
      setFavorites(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar los favoritos."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFavorites();
    const handler = () => void loadFavorites(true);
    window.addEventListener(FAVORITES_CHANGED_EVENT, handler);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, handler);
    };
  }, [loadFavorites]);

  return (
    <main className="space-y-10 sm:space-y-12">
      <PageHeader
        eyebrow="Tu colección"
        title="Mis favoritos"
        description="Guarda las historias que más te gustan y encuéntralas aquí cuando quieras."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
            <Heart className="size-3.5" fill="currentColor" />
            {favorites.length}{" "}
            {favorites.length === 1 ? "contenido guardado" : "contenidos guardados"}
          </span>
        }
      />

      {loading ? (
        <div className="surface-card flex flex-col items-center rounded-2xl p-12 text-center">
          <LoaderCircle className="mb-4 size-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Cargando favoritos...</p>
        </div>
      ) : error ? (
        <div className="surface-card flex flex-col items-center rounded-2xl border-accent/30 p-8 text-center">
          <AlertCircle className="mb-3 size-8 text-accent" />
          <p className="mb-4 text-sm font-semibold text-foreground">{error}</p>
          <Button onClick={() => void loadFavorites(true)} variant="outline">
            Reintentar
          </Button>
        </div>
      ) : favorites.length === 0 ? (
        <div className="surface-card flex flex-col items-center rounded-2xl p-8 text-center sm:p-16">
          <Heart className="mb-4 size-10 text-accent sm:size-12" />
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            Todavía no tienes favoritos
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Explora nuestro catálogo y guarda las películas que más te interesen.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Explorar películas
          </Link>
        </div>
      ) : (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Tu colección
            </h2>
            <p className="text-sm text-muted-foreground">
              Todo lo que has guardado hasta ahora.
            </p>
          </div>
          <MovieGrid movies={favorites} onMovieClick={setSelectedMovie} />
        </section>
      )}

      {selectedMovie && (
        <MovieDetails
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </main>
  );
}