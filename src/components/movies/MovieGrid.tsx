import MovieCard from "./MovieCard";
import type { Movie } from "@/services/movieService";

interface MovieGridProps {
  movies: Movie[];
  onMovieClick?: (movie: Movie) => void;
}

export default function MovieGrid({ movies, onMovieClick }: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="surface-card flex flex-col items-center rounded-2xl p-8 text-center sm:p-12">
        <h3 className="text-lg font-bold text-foreground sm:text-xl">
          No hay películas disponibles
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Todavía no encontramos películas para mostrar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onClick={onMovieClick}
        />
      ))}
    </div>
  );
}