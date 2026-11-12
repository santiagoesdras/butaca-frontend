import { Clock3, CalendarDays, Film } from "lucide-react";
import { EMOTIONS, toFrontendEmotion } from "@/lib/emotions";
import type { HistoryEntry } from "@/types/history";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";

interface DayDetailProps {
  entry: HistoryEntry | null;
}

export function DayDetail({ entry }: DayDetailProps) {
  if (!entry) {
    return (
      <EmptyState
        title="Selecciona un día"
        description="Elige una fecha en el calendario para consultar tu historial emocional."
        icon={<CalendarDays className="size-7" />}
      />
    );
  }

  const formattedDate = new Date(`${entry.date}T12:00:00`).toLocaleDateString(
    "es-GT",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const emotion = toFrontendEmotion(entry.mood);
  const emotionInfo = emotion ? EMOTIONS[emotion] : null;

  const time = new Date(entry.detected_at).toLocaleTimeString("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <section className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Detalle del día
        </p>

        <h2 className="text-xl font-bold capitalize text-foreground">
          {formattedDate}
        </h2>

        <p className="text-sm text-muted-foreground">
          {entry.recommendations.length}{" "}
          {entry.recommendations.length === 1
            ? "recomendación"
            : "recomendaciones"}
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/50 p-3">
        <span
          className="mt-1 size-3 shrink-0 rounded-full"
          style={{
            backgroundColor: emotionInfo?.color ?? "var(--muted-foreground)",
          }}
        />

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="font-semibold text-foreground">
              {entry.name}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock3 className="size-3 shrink-0" />
              {time}
            </p>
          </div>

          {entry.recommendations.length > 0 && (
            <div className="space-y-2">
              {entry.recommendations.map((rec) => (
                <div
                  key={`${rec.tmdb_id}-${rec.media_type}`}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Film className="mt-0.5 size-4 shrink-0 text-accent" />
                  <p>
                    <span className="font-medium text-foreground">
                      {rec.media_type === "tv" ? "Serie" : "Película"} recomendada:
                    </span>{" "}
                    {rec.title}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Badge variant="outline">
            {entry.confidence !== null
              ? `${entry.confidence.toFixed(1)}% de confianza`
              : "Elegida por ti"}
          </Badge>
        </div>
      </div>
    </section>
  );
}