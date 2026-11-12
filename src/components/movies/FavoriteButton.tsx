import { useEffect, useState } from "react";
import { Heart, LoaderCircle } from "lucide-react";

import type { Movie } from "@/services/movieService";
import {
  FAVORITES_CHANGED_EVENT,
  isFavorite,
  toggleFavorite,
} from "@/services/favoritesService";

interface FavoriteButtonProps {
  movie: Movie;
  onToggle?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({ movie, onToggle }: FavoriteButtonProps) {
  // null = cargando el estado inicial, true/false = estado conocido
  const [favorite, setFavorite] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    // Delay aleatorio para repartir las verificaciones y no saturar el Gateway.
    const timeout = setTimeout(async () => {
      try {
        const value = await isFavorite(movie);
        if (active) setFavorite(value);
      } catch {
        if (active) setFavorite(false);
      }
    }, 100 + Math.random() * 200);

    // Cuando otro botón cambia un favorito, refrescamos este también.
    function refresh() {
      void isFavorite(movie).then((value) => {
        if (active) setFavorite(value);
      });
    }
    window.addEventListener(FAVORITES_CHANGED_EVENT, refresh);

    return () => {
      active = false;
      clearTimeout(timeout);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, refresh);
    };
  }, [movie.id, movie.media_type]);

  async function handleToggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (busy || favorite === null) return;

    setBusy(true);
    // Optimistic update: cambiamos el ícono inmediatamente.
    const optimistic = !favorite;
    setFavorite(optimistic);

    try {
      const updated = await toggleFavorite(movie);
      setFavorite(updated);
      onToggle?.(updated);
    } catch {
      // Si falla, revertimos el optimistic update.
      setFavorite(favorite);
    } finally {
      setBusy(false);
    }
  }

  const isLoading = favorite === null;
  const isFav = favorite === true;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={busy || isLoading}
      aria-label={
        isFav
          ? `Quitar ${movie.title} de favoritos`
          : `Agregar ${movie.title} a favoritos`
      }
      aria-pressed={isFav}
      title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={`flex size-9 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-200 hover:scale-110 disabled:opacity-60 disabled:hover:scale-100 sm:size-10 ${
        isFav
          ? "border-accent/60 bg-accent text-accent-foreground shadow-[0_0_0_1px_hsl(var(--accent)/0.4),0_8px_24px_-8px_hsl(var(--accent)/0.6)]"
          : "border-border/60 bg-background/70 text-foreground/80 hover:border-accent/60 hover:text-accent"
      }`}
    >
      {isLoading ? (
        <LoaderCircle size={16} className="animate-spin sm:size-[18px]" />
      ) : (
        <Heart size={18} className="sm:size-5" fill={isFav ? "currentColor" : "none"} />
      )}
    </button>
  );
}