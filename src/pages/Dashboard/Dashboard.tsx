import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clapperboard,
  Film,
  Heart,
  Smile,
  Tags,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { EMOTIONS, toFrontendEmotion } from "@/lib/emotions";
import type { Emotion, MoodSummary, SummaryPeriod } from "@/types/history";

import {
  FAVORITES_CHANGED_EVENT,
  getFavorites,
} from "@/services/favoritesService";
import { getGenres } from "@/services/movieService";
import { useMoodSummary } from "@/hooks/useMoodSummary";

type Period = SummaryPeriod;

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "year", label: "Este año" },
];

type TrendPoint = {
  label: string;
} & Partial<Record<Emotion, number>>;

/** Etiqueta de cada punto de la evolución: día de la semana (7d), día y mes (30d) o mes (year). */
function bucketLabel(bucket: string, period: Period): string {
  if (period === "year") {
    return new Date(`${bucket}-01T12:00:00`).toLocaleDateString("es-GT", { month: "short" });
  }
  const date = new Date(`${bucket}T12:00:00`);
  return period === "7d"
    ? date.toLocaleDateString("es-GT", { weekday: "short" })
    : date.toLocaleDateString("es-GT", { day: "numeric", month: "short" });
}

function buildTrendData(summary: MoodSummary | null, period: Period): TrendPoint[] {
  if (!summary || summary.total_records === 0) return [];
  return summary.timeline.map(({ bucket, counts }) => {
    const point: TrendPoint = { label: bucketLabel(bucket, period) };
    for (const [mood, count] of Object.entries(counts)) {
      const emotion = toFrontendEmotion(mood);
      if (emotion) point[emotion] = count;
    }
    return point;
  });
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-GT", {
    day: "numeric",
    month: "short",
  });
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("30d");

  // --- Resumen agregado por el backend (GET /api/v1/emotions/summary) ---
  const { summary, loading: historyLoading, error: historyError } = useMoodSummary(period);

  // --- Favoritos (API de Library) ---
  const [favoriteCount, setFavoriteCount] = useState<number | null>(null);

  useEffect(() => {
    async function update() {
      try {
        const favs = await getFavorites(true);
        setFavoriteCount(favs.length);
      } catch {
        setFavoriteCount(0);
      }
    }
    void update();
    window.addEventListener(FAVORITES_CHANGED_EVENT, update);
    return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, update);
  }, []);

  // --- Nombres de géneros para "qué tipo de contenido te recomendamos" ---
  const [genreNames, setGenreNames] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    getGenres("all")
      .then(({ genres }) => setGenreNames(new Map(genres.map((genre) => [genre.id, genre.name]))))
      .catch(() => setGenreNames(new Map()));
  }, []);

  // --- Derivados del resumen ---
  const emotionCounts = useMemo(() => {
    const counts: Record<Emotion, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0,
      calm: 0,
    };
    summary?.distribution.forEach(({ mood, count }) => {
      const emotion = toFrontendEmotion(mood);
      if (emotion) counts[emotion] = count;
    });
    return counts;
  }, [summary]);

  const dominantEmotion: Emotion | null = summary?.predominant
    ? toFrontendEmotion(summary.predominant.mood)
    : null;

  const emotionData = useMemo(
    () =>
      (Object.keys(EMOTIONS) as Emotion[])
        .map((emotion) => ({
          name: EMOTIONS[emotion].label,
          value: emotionCounts[emotion],
          color: EMOTIONS[emotion].color,
        }))
        .filter((item) => item.value > 0),
    [emotionCounts]
  );

  const trendData = useMemo(() => buildTrendData(summary, period), [summary, period]);

  const recentRecommendations = useMemo(
    () =>
      (summary?.recommendations.recent ?? []).map((rec) => ({
        key: `${rec.date}-${rec.tmdb_id}-${rec.media_type}`,
        title: rec.title,
        emotion: rec.mood,
        emotionName: rec.mood_name,
        date: rec.date,
        mediaType: rec.media_type,
      })),
    [summary]
  );

  const topGenres = useMemo(
    () =>
      (summary?.recommendations.by_genre ?? []).slice(0, 6).map(({ genre_id, count }) => ({
        id: genre_id,
        name: genreNames.get(genre_id) ?? `Género ${genre_id}`,
        count,
      })),
    [summary, genreNames]
  );

  const totalRecommendations = summary?.recommendations.total ?? 0;
  const byMediaType = summary?.recommendations.by_media_type ?? { movie: 0, tv: 0 };
  const recordedDays = summary?.days_with_records ?? 0;
  const hasHistoryData = (summary?.total_records ?? 0) > 0;

  return (
    <main className="space-y-6 sm:space-y-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <PageHeader
          eyebrow="Tu experiencia en Butaca"
          title="Mi Recap"
          description="Un vistazo a tu recorrido emocional y cinematográfico."
        />

        {/* Selector del período */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="size-4 text-primary" />
            Resumen de tu actividad
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {PERIODS.map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant={period === item.value ? "default" : "outline"}
                onClick={() => setPeriod(item.value)}
                className="h-7 px-2 text-[11px] sm:h-9 sm:px-3 sm:text-sm"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {historyLoading ? (
          <div className="surface-card flex flex-col items-center rounded-2xl p-12 text-center">
            <Activity className="mb-4 size-8 animate-pulse text-primary" />
            <p className="text-sm text-muted-foreground">Cargando tu historial...</p>
          </div>
        ) : historyError ? (
          <div className="surface-card flex flex-col items-center rounded-2xl border-accent/30 p-8 text-center">
            <Activity className="mb-3 size-8 text-accent" />
            <p className="text-sm font-semibold text-foreground">{historyError}</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* MUNDO EMOCIONAL */}
            <section className="min-w-0 space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Smile className="size-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">
                    Tu mundo emocional
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Conoce cómo se han distribuido tus emociones.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Días con registro
                  </p>
                  <p className="mt-2 text-3xl font-black tabular-nums text-foreground">
                    {recordedDays}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <p className="text-xs text-muted-foreground">
                    Emoción predominante
                  </p>
                  <p className="mt-2 text-xl font-bold text-foreground">
                    {dominantEmotion
                      ? EMOTIONS[dominantEmotion].label
                      : "Sin registros"}
                  </p>
                  {dominantEmotion && (
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: EMOTIONS[dominantEmotion].color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {emotionCounts[dominantEmotion]} {emotionCounts[dominantEmotion] === 1 ? "día" : "días"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Distribución de emociones */}
              <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
                <div>
                  <h3 className="font-bold text-foreground">
                    Distribución de emociones
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Frecuencia de cada emoción en el período.
                  </p>
                </div>

                {emotionData.length > 0 ? (
                  <>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={emotionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {emotionData.map((item) => (
                              <Cell key={item.name} fill={item.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0e2520",
                              border: "1px solid #1f5656",
                              borderRadius: "10px",
                              color: "#ffffff",
                            }}
                            formatter={(value) => [`${value} días`, "Cantidad"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {(Object.keys(EMOTIONS) as Emotion[]).map((emotion) => (
                        <div key={emotion} className="flex items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: EMOTIONS[emotion].color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {EMOTIONS[emotion].label}
                          </span>
                          <span className="ml-auto text-xs font-semibold tabular-nums text-foreground">
                            {emotionCounts[emotion]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-56 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border/60 px-6 text-center">
                    <Activity className="mb-3 size-8 text-primary/60" />
                    <p className="text-sm font-semibold text-foreground">
                      Aún no hay registros
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cuando uses la cámara, tus emociones aparecerán acá.
                    </p>
                  </div>
                )}
              </div>

              {/* Evolución emocional */}
              <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
                <div>
                  <h3 className="font-bold text-foreground">
                    Evolución emocional
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Cómo han variado tus emociones durante el período.
                  </p>
                </div>

                {trendData.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#6d523e"
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "#7c8075", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fill: "#7c8075", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0e2520",
                            border: "1px solid #1f5656",
                            borderRadius: "10px",
                            color: "#ffffff",
                          }}
                        />
                        {(Object.keys(EMOTIONS) as Emotion[]).map((emotion) => (
                          <Line
                            key={emotion}
                            type="monotone"
                            dataKey={emotion}
                            name={EMOTIONS[emotion].label}
                            stroke={EMOTIONS[emotion].color}
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border/60 px-6 text-center">
                    <TrendingUp className="mb-3 size-8 text-primary/60" />
                    <p className="text-sm font-semibold text-foreground">
                      Sin evolución todavía
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      La evolución aparecerá cuando tengas registros en el período.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* RECORRIDO CINEMATOGRÁFICO */}
            <section className="min-w-0 space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clapperboard className="size-5 text-accent" />
                  <h2 className="text-xl font-bold text-foreground">
                    Tu recorrido cinematográfico
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Las películas que Butaca te ha recomendado y las que has guardado.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Film className="size-4 text-accent" />
                    <p className="text-xs">Recomendaciones</p>
                  </div>
                  <p className="mt-2 text-3xl font-black tabular-nums text-foreground">
                    {totalRecommendations}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="size-4 text-accent" />
                    <p className="text-xs">Favoritos guardados</p>
                  </div>
                  <p className="mt-2 text-3xl font-black tabular-nums text-foreground">
                    {favoriteCount}
                  </p>
                </div>
              </div>

              {/* Recomendaciones recientes */}
              <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
                <div>
                  <h3 className="font-bold text-foreground">
                    Recomendaciones recientes
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Algunas películas recomendadas a partir de tus emociones.
                  </p>
                </div>

                {recentRecommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recentRecommendations.map((movie) => {
                      const emotion = toFrontendEmotion(movie.emotion);
                      const emotionInfo = emotion ? EMOTIONS[emotion] : null;
                      return (
                        <div
                          key={movie.key}
                          className="flex items-center gap-3 rounded-lg border border-border/70 bg-card/60 p-3"
                        >
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-accent">
                            <Film className="size-6" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {movie.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {movie.mediaType === "tv" ? "Serie" : "Película"} ·{" "}
                              {movie.emotionName}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDate(movie.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 px-6 py-10 text-center">
                    <Clapperboard className="mb-3 size-8 text-accent/60" />
                    <p className="text-sm font-semibold text-foreground">
                      Todavía no hay recomendaciones por emoción
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Aparecerán cuando registres tu ánimo con la cámara.
                    </p>
                  </div>
                )}
              </div>

              {/* Tipo de contenido recomendado */}
              <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
                <div className="flex items-center gap-2">
                  <Tags className="size-4 text-primary" />
                  <h3 className="font-bold text-foreground">
                    Qué tipo de contenido te recomendamos
                  </h3>
                </div>
                {totalRecommendations > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {byMediaType.movie} {byMediaType.movie === 1 ? "película" : "películas"} ·{" "}
                      {byMediaType.tv} {byMediaType.tv === 1 ? "serie" : "series"}
                    </p>
                    <div className="flex flex-wrap gap-2" data-testid="top-genres">
                      {topGenres.map((genre) => (
                        <span
                          key={genre.id}
                          className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-foreground"
                        >
                          {genre.name}
                          <span className="ml-1.5 font-semibold tabular-nums text-accent">{genre.count}</span>
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Los géneros aparecerán cuando guardes recomendaciones según tu ánimo.
                  </p>
                )}
              </div>

              {/* Actividad */}
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  <h3 className="font-bold text-foreground">
                    Tu actividad cinematográfica
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {hasHistoryData ? (
                    <>
                      Has recibido{" "}
                      <span className="font-semibold text-foreground">
                        {totalRecommendations} recomendaciones
                      </span>{" "}
                      durante este período y has guardado{" "}
                      <span className="font-semibold text-foreground">
                        {favoriteCount} favoritas
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      Aún no hay actividad registrada en este período. Tienes{" "}
                      <span className="font-semibold text-foreground">
                        {favoriteCount} favoritas
                      </span>{" "}
                      guardadas.
                    </>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to="/favorites"
                    className="inline-block text-sm font-semibold text-accent hover:underline"
                  >
                    Ver mis favoritos
                  </Link>
                  <Link
                    to="/history"
                    className="inline-block text-sm font-semibold text-accent hover:underline"
                  >
                    Ir al historial
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}