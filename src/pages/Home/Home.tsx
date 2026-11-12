import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Film,
  Tv,
} from "lucide-react";

import MovieCard from "@/components/movies/MovieCard";
import MovieDetails from "@/components/movies/MovieDetails";

import type { Movie } from "@/services/movieService";
import {
  getTrending,
  getPopularMovies,
  getPopularSeries,
} from "@/services/movieService";

type SectionStatus = "idle" | "loading" | "error" | "done";

interface SectionState {
  movies: Movie[];
  page: number;
  totalPages: number;
  status: SectionStatus;
  error: string | null;
  loadingMore: boolean;
}

const INITIAL_STATE: SectionState = {
  movies: [],
  page: 0,
  totalPages: 0,
  status: "idle",
  error: null,
  loadingMore: false,
};

const MAX_PAGES = 500;

export default function Home() {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [trending, setTrending] = useState<SectionState>(INITIAL_STATE);
  const [popularMovies, setPopularMovies] = useState<SectionState>(INITIAL_STATE);
  const [popularSeries, setPopularSeries] = useState<SectionState>(INITIAL_STATE);

  /* ---------- Tendencias (1 sola página) ---------- */
  const loadTrending = useCallback(async () => {
    setTrending((s) => ({ ...s, status: "loading", error: null }));
    try {
      const res = await getTrending();
      setTrending({
        movies: res.results,
        page: 1,
        totalPages: 1,
        status: "done",
        error: null,
        loadingMore: false,
      });
    } catch (e) {
      setTrending({
        ...INITIAL_STATE,
        status: "error",
        error: e instanceof Error ? e.message : "No se pudieron cargar las tendencias.",
      });
    }
  }, []);

  /* ---------- Películas populares (paginadas) ---------- */
  const loadPopularMovies = useCallback(async (targetPage: number) => {
    setPopularMovies((s) =>
      targetPage === 1
        ? { ...s, status: "loading", error: null }
        : { ...s, loadingMore: true, error: null }
    );
    try {
      const res = await getPopularMovies(targetPage);
      setPopularMovies((s) => ({
        movies:
          targetPage === 1 ? res.results : [...s.movies, ...res.results],
        page: targetPage,
        totalPages: res.total_pages ?? 0,
        status: "done",
        error: null,
        loadingMore: false,
      }));
    } catch (e) {
      setPopularMovies((s) => ({
        ...s,
        status: s.movies.length === 0 ? "error" : "done",
        loadingMore: false,
        error:
          s.movies.length === 0
            ? e instanceof Error
              ? e.message
              : "No se pudieron cargar las películas."
            : s.error,
      }));
    }
  }, []);

  /* ---------- Series populares (paginadas) ---------- */
  const loadPopularSeries = useCallback(async (targetPage: number) => {
    setPopularSeries((s) =>
      targetPage === 1
        ? { ...s, status: "loading", error: null }
        : { ...s, loadingMore: true, error: null }
    );
    try {
      const res = await getPopularSeries(targetPage);
      setPopularSeries((s) => ({
        movies:
          targetPage === 1 ? res.results : [...s.movies, ...res.results],
        page: targetPage,
        totalPages: res.total_pages ?? 0,
        status: "done",
        error: null,
        loadingMore: false,
      }));
    } catch (e) {
      setPopularSeries((s) => ({
        ...s,
        status: s.movies.length === 0 ? "error" : "done",
        loadingMore: false,
        error:
          s.movies.length === 0
            ? e instanceof Error
              ? e.message
              : "No se pudieron cargar las series."
            : s.error,
      }));
    }
  }, []);

  useEffect(() => {
    void loadTrending();
    void loadPopularMovies(1);
    void loadPopularSeries(1);
  }, [loadTrending, loadPopularMovies, loadPopularSeries]);

  return (
    <main className="space-y-12 sm:space-y-16">
      {/* Hero */}
      <section className="relative -mx-4 overflow-hidden px-4 py-12 sm:-mx-6 sm:px-6 sm:py-16 lg:-mx-12 lg:px-12 lg:py-20">
        {trending.movies[0]?.poster_path && (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-15 sm:opacity-20"
            style={{
              backgroundImage: `url(https://image.tmdb.org/t/p/original${trending.movies[0].poster_path})`,
            }}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, hsl(var(--background)) 0%, hsl(var(--background)/0.92) 55%, hsl(var(--secondary)/0.35) 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
          <p className="eyebrow flex items-center gap-2">
            <span className="h-px w-4 bg-accent/60" />
            Tu próxima historia
          </p>
          <h1 className="title-poster break-words text-5xl text-foreground sm:text-6xl lg:text-8xl">
            BUTACA
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg">
            Historias que conectan con tus emociones. Explora películas,
            descubre nuevas historias y guarda tus favoritas en un solo lugar.
          </p>
        </div>
      </section>

      <CarouselSection
        eyebrow="Tendencias"
        title="Lo más visto hoy"
        icon={<Clapperboard className="size-4 text-accent" />}
        state={trending}
        onRetry={() => void loadTrending()}
        onMovieClick={setSelectedMovie}
      />

      <CarouselSection
        eyebrow="Películas"
        title="Películas populares"
        icon={<Film className="size-4 text-accent" />}
        state={popularMovies}
        onRetry={() => void loadPopularMovies(1)}
        onLoadMore={() => void loadPopularMovies(popularMovies.page + 1)}
        onMovieClick={setSelectedMovie}
      />

      <CarouselSection
        eyebrow="Series"
        title="Series populares"
        icon={<Tv className="size-4 text-accent" />}
        state={popularSeries}
        onRetry={() => void loadPopularSeries(1)}
        onLoadMore={() => void loadPopularSeries(popularSeries.page + 1)}
        onMovieClick={setSelectedMovie}
      />

      {selectedMovie && (
        <MovieDetails
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </main>
  );
}

interface CarouselSectionProps {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  state: SectionState;
  onRetry: () => void;
  onLoadMore?: () => void;
  onMovieClick: (movie: Movie) => void;
}

function CarouselSection({
  eyebrow,
  title,
  icon,
  state,
  onRetry,
  onLoadMore,
  onMovieClick,
}: CarouselSectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { movies, status, error, page, totalPages, loadingMore } = state;

  function scroll(direction: "left" | "right") {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  }

  const canLoadMore =
    !!onLoadMore &&
    page > 0 &&
    totalPages > 0 &&
    page < Math.min(totalPages, MAX_PAGES);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="eyebrow flex items-center gap-2">
            {icon}
            {eyebrow}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
        </div>

        {movies.length > 0 && (
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Scrollear a la izquierda"
              className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-accent/60 hover:text-accent"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Scrollear a la derecha"
              className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-accent/60 hover:text-accent"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {status === "loading" && movies.length === 0 && (
        <div className="surface-card flex flex-col items-center rounded-2xl p-12 text-center">
          <div className="mb-4 size-10 animate-spin rounded-full border-4 border-border border-t-accent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      )}

      {status === "error" && (
        <div className="surface-card flex flex-col items-center rounded-2xl border-accent/30 p-8 text-center">
          <AlertCircle className="mb-3 size-8 text-accent" />
          <p className="mb-4 text-sm font-semibold text-foreground">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <RefreshCw size={16} />
            Intentar de nuevo
          </button>
        </div>
      )}

      {status === "done" && movies.length === 0 && (
        <div className="surface-card flex flex-col items-center rounded-2xl p-8 text-center">
          <Clapperboard className="mb-3 size-8 text-accent" />
          <p className="text-sm font-semibold text-foreground">
            No hay contenido disponible
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vuelve más tarde para descubrir nuevas historias.
          </p>
        </div>
      )}

      {movies.length > 0 && (
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {movies.map((movie) => (
            <div
              key={`${movie.media_type}-${movie.id}`}
              className="w-32 shrink-0 snap-start sm:w-40"
            >
              <MovieCard movie={movie} onClick={onMovieClick} />
            </div>
          ))}

          {/* Botón "Ver más" como última card del carrusel */}
          {canLoadMore && (
            <div className="flex w-32 shrink-0 snap-start items-center justify-center sm:w-40">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="flex h-full min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 px-3 py-6 text-center transition hover:border-accent/60 hover:bg-card/80 disabled:opacity-60 sm:min-h-[220px]"
              >
                {loadingMore ? (
                  <>
                    <div className="size-6 animate-spin rounded-full border-2 border-border border-t-accent" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Cargando...
                    </span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="size-6 text-accent" />
                    <span className="text-xs font-semibold text-foreground">
                      Ver más
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}