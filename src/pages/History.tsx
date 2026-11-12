import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Activity, LoaderCircle, AlertCircle } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { EmotionHeatmap } from "@/components/history/EmotionHeatmap";
import { EmotionLegend } from "@/components/history/EmotionLegend";
import { DayDetail } from "@/components/history/DayDetail";
import { useMoodHistory } from "@/hooks/useMoodHistory";

export default function History() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // El mapa anual necesita el año completo, no solo los últimos 30 días.
  const { entries, loading, error } = useMoodHistory({ year });

  const entriesThisYear = useMemo(
    () => entries.filter((entry) => entry.date.startsWith(String(year))),
    [entries, year]
  );

  const selectedEntry =
    entriesThisYear.find((entry) => entry.date === selectedDate) ?? null;

  const recordedDays = entriesThisYear.length;
  const totalRecommendations = entriesThisYear.reduce(
    (total, entry) => total + entry.recommendations.length,
    0
  );

  function changeYear(direction: number) {
    setYear((previous) => previous + direction);
    setSelectedDate(null);
  }

  return (
    <main className="space-y-6 sm:space-y-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <PageHeader
          eyebrow="Tu recorrido emocional"
          title="Mi historial"
          description="Explora tus emociones y descubre cómo ha sido tu recorrido durante el año."
        />

        {loading ? (
          <div className="surface-card flex flex-col items-center rounded-2xl p-12 text-center">
            <LoaderCircle className="mb-4 size-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Cargando historial...</p>
          </div>
        ) : error ? (
          <div className="surface-card flex flex-col items-center rounded-2xl border-accent/30 p-8 text-center">
            <AlertCircle className="mb-3 size-8 text-accent" />
            <p className="text-sm font-semibold text-foreground">{error}</p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="surface-card rounded-2xl p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-4" />
                  <span className="text-sm">Días registrados</span>
                </div>
                <p className="mt-3 text-3xl font-black text-foreground">
                  {recordedDays}
                </p>
              </div>
              <div className="surface-card rounded-2xl p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="size-4" />
                  <span className="text-sm">Recomendaciones</span>
                </div>
                <p className="mt-3 text-3xl font-black text-foreground">
                  {totalRecommendations}
                </p>
              </div>
            </section>

            <section className="w-full space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                    Historial anual
                  </p>
                  <h2 className="text-lg font-bold text-foreground">
                    Tu año en emociones
                  </h2>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => changeYear(-1)}
                    aria-label="Año anterior"
                    className="size-7 sm:size-9"
                  >
                    <ChevronLeft className="size-3.5 sm:size-4" />
                  </Button>
                  <span className="min-w-12 text-center text-base font-bold tabular-nums sm:min-w-16 sm:text-lg">
                    {year}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => changeYear(1)}
                    aria-label="Año siguiente"
                    className="size-7 sm:size-9"
                  >
                    <ChevronRight className="size-3.5 sm:size-4" />
                  </Button>
                </div>
              </div>

              <EmotionHeatmap
                year={year}
                entries={entriesThisYear}
                selectedDate={selectedDate}
                onSelectDay={setSelectedDate}
              />

              <div className="border-t border-border pt-4">
                <EmotionLegend />
              </div>
            </section>

            <DayDetail entry={selectedEntry} />
          </>
        )}
      </div>
    </main>
  );
}