import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  Camera,
  LoaderCircle,
  Film,
} from "lucide-react";

import MovieDetails from "@/components/movies/MovieDetails";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { CameraPermission } from "@/components/camera/CameraPermission";
import { CameraView } from "@/components/camera/CameraView";
import { EmotionResult } from "@/components/camera/EmotionResult";

import type { Movie } from "@/services/movieService";
import { getRecommendations } from "@/services/recommendationsService";
import {
  getHistory,
  saveRecommendationForDay,
  revokeCameraConsent,
} from "@/services/historyService";
import { useEmotionDetection } from "@/hooks/useEmotionDetection";
import { EMOTIONS, moodLabel, toFrontendEmotion } from "@/lib/emotions";
import type { HistoryEntry } from "@/types/history";

type FlowStep = "idle" | "permission" | "camera" | "result" | "recommendation";

export default function Recommendations() {
  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [recommended, setRecommended] = useState<Movie | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const {
    step: detectionStep,
    error: detectionError,
    canRetrySameImage,
    analysis,
    savedId,
    analyze,
    retryAnalyze,
    clearError: clearDetectionError,
    saveWithEmotion,
    reset: resetDetection,
  } = useEmotionDetection();

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const entries = await getHistory("30d");
      setHistoryEntries(entries);
    } catch (e) {
      setHistoryError(
        e instanceof Error ? e.message : "No se pudo cargar el historial."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const startFlow = () => {
    setError(null);
    setRecommended(null);
    resetDetection();
    setFlowStep("permission");
  };

  const handlePermissionAccepted = () => setFlowStep("camera");

  const handlePermissionCancelled = async () => {
    // Si el usuario cancela, revocamos el consentimiento persistente (si existía).
    try {
      await revokeCameraConsent();
    } catch {
      // Silencioso: si falla (por ejemplo, porque no había consentimiento), no pasa nada.
    }
    setFlowStep("idle");
  };

  const handleCapture = async (blob: Blob) => {
    const success = await analyze(blob);
    // Solo avanzamos a "result" si el análisis fue exitoso.
    // Si falla (p.ej. 502), la cámara permanece montada y CameraView
    // muestra el banner de error con opciones de reintento.
    if (success) setFlowStep("result");
  };

  const handleRetryAnalysis = async () => {
    const success = await retryAnalyze();
    if (success) setFlowStep("result");
  };

  const handleNewCapture = () => {
    clearDetectionError();
  };

  const handleConfirmEmotion = useCallback(
    async (mediaType: "movie" | "tv") => {
      if (!analysis?.suggestedExpression) return;
      setError(null);
      setLoadingRec(true);
      try {
        const historyId =
          savedId ??
          (await saveWithEmotion(analysis.suggestedExpression));
        if (!historyId) throw new Error("No se pudo guardar la detección.");

        const results = await getRecommendations({
          media_type: mediaType,
          mood: analysis.suggestedExpression,
          limit: 1,
        });
        const movie = results[0];
        if (!movie)
          throw new Error("No encontramos una recomendación para tu ánimo.");

        await saveRecommendationForDay(historyId, mediaType, Number(movie.id), {
          title: movie.title,
          poster_path: movie.poster_path ?? null,
          overview: movie.overview ?? null,
          release_date: movie.release_date ?? null,
          vote_average: movie.vote_average ?? null,
          genre_ids: movie.genre_ids ?? [],
        });

        setRecommended(movie);
        setFlowStep("recommendation");
        void loadHistory();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "No se pudo generar la recomendación."
        );
      } finally {
        setLoadingRec(false);
      }
    },
    [analysis, savedId, saveWithEmotion, loadHistory]
  );

  const handleClose = () => {
    setFlowStep("idle");
    resetDetection();
  };

  return (
    <main className="space-y-10 sm:space-y-12">
      <PageHeader
        eyebrow="Personalizado para ti"
        title="Recomendaciones"
        description="Analiza tu ánimo y recibe una recomendación única basada en cómo te sentís."
      />

      {/* FLUJO ACTIVO */}
      {flowStep === "permission" && (
        <CameraPermission
          onAccept={handlePermissionAccepted}
          onCancel={handlePermissionCancelled}
        />
      )}

      {flowStep === "camera" && (
        <CameraView
          onCapture={handleCapture}
          onClose={handleClose}
          analyzing={detectionStep === "analyzing"}
          analyzeError={detectionError}
          canRetryAnalysis={canRetrySameImage}
          onRetryAnalysis={handleRetryAnalysis}
          onNewCapture={handleNewCapture}
        />
      )}

      {flowStep === "result" && analysis && (
        <EmotionResult
          emotion={analysis.suggestedExpression}
          confidence={analysis.confidence}
          reason={analysis.reason}
          onConfirm={handleConfirmEmotion}
          onRetry={() => setFlowStep("camera")}
          saving={detectionStep === "saving" || loadingRec}
        />
      )}

      {flowStep !== "camera" && (error || detectionError) && (
        <div className="surface-card flex flex-col items-center rounded-2xl border-accent/30 p-8 text-center">
          <AlertCircle className="mb-3 size-8 text-accent" />
          <p className="mb-4 text-sm font-semibold text-foreground">
            {error ?? detectionError}
          </p>
          <Button onClick={startFlow} variant="outline">
            Reintentar
          </Button>
        </div>
      )}

      {flowStep === "result" && loadingRec && (
        <div className="surface-card flex flex-col items-center rounded-2xl p-12 text-center">
          <LoaderCircle className="mb-4 size-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">
            Buscando la película perfecta para tu ánimo...
          </p>
        </div>
      )}

      {flowStep === "recommendation" && recommended && (
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="eyebrow">Tu recomendación</p>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Para tu ánimo de hoy
            </h2>
          </div>
          <div className="surface-card surface-card-hover flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:p-6">
            {recommended.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w300${recommended.poster_path}`}
                alt={recommended.title}
                className="h-48 w-32 shrink-0 rounded-xl object-cover"
              />
            )}
            <div className="flex flex-1 flex-col justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {recommended.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {recommended.media_type === "tv" ? "Serie" : "Película"}
                  {recommended.release_date
                    ? ` · ${recommended.release_date.slice(0, 4)}`
                    : ""}
                </p>
                {recommended.overview && (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                    {recommended.overview}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setSelectedMovie(recommended)}>
                  Ver detalles
                </Button>
                <Button variant="outline" onClick={startFlow}>
                  Analizar otra vez
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {flowStep === "idle" && (
        <div className="surface-card flex flex-col items-center rounded-2xl p-12 text-center sm:p-16">
          <Sparkles className="mb-4 size-10 text-accent" />
          <h3 className="text-lg font-bold text-foreground sm:text-xl">
            Tu recomendación personalizada
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Analiza tu ánimo con la cámara y te recomendamos una película o
            serie acorde a cómo te sentís.
          </p>
          <Button onClick={startFlow} className="mt-6 gap-2">
            <Camera className="size-4" />
            Analizar mi ánimo
          </Button>
        </div>
      )}

      {/* LISTA HISTÓRICA */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="eyebrow">Tu historial</p>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Recomendaciones anteriores
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            disabled={historyLoading}
            className="gap-2"
          >
            <RefreshCw
              className={`size-4 ${historyLoading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        {historyLoading ? (
          <div className="surface-card rounded-2xl p-8 text-center">
            <LoaderCircle className="mx-auto mb-3 size-6 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">
              Cargando historial...
            </p>
          </div>
        ) : historyError ? (
          <div className="surface-card rounded-2xl border-accent/30 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 size-6 text-accent" />
            <p className="text-sm text-foreground">{historyError}</p>
          </div>
        ) : historyEntries.length === 0 ? (
          <div className="surface-card flex flex-col items-center rounded-2xl p-8 text-center sm:p-12">
            <Film className="mb-3 size-8 text-accent" />
            <p className="text-sm font-semibold text-foreground">
              Todavía no tienes recomendaciones guardadas
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Analiza tu ánimo para recibir tu primera recomendación.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {historyEntries.flatMap((entry) =>
              entry.recommendations.map((rec) => {
                // Cada recomendación muestra la emoción con la que se hizo, no la última del día.
                const recMood = rec.mood ?? entry.mood;
                const emotion = toFrontendEmotion(recMood);
                const emotionInfo = emotion ? EMOTIONS[emotion] : null;
                return (
                  <li
                    key={`${entry.id}-${rec.tmdb_id}-${rec.media_type}`}
                    className="surface-card surface-card-hover flex items-center gap-3 rounded-xl p-3 sm:p-4"
                  >
                    {rec.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${rec.poster_path}`}
                        alt={rec.title}
                        className="h-14 w-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor:
                            emotionInfo?.color ?? "var(--secondary)",
                        }}
                      >
                        <Film className="size-5 text-white" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {rec.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className="rounded-full px-2 py-0.5 font-semibold"
                          style={{
                            backgroundColor: emotionInfo?.color
                              ? `${emotionInfo.color}20`
                              : "var(--muted)",
                            color:
                              emotionInfo?.color ??
                              "var(--muted-foreground)",
                          }}
                        >
                          {moodLabel(recMood)}
                        </span>
                        <span>·</span>
                        <span>{formatDate(entry.date)}</span>
                        <span>·</span>
                        <span>
                          {rec.media_type === "tv" ? "Serie" : "Película"}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </section>

      {selectedMovie && (
        <MovieDetails
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </main>
  );
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-GT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}