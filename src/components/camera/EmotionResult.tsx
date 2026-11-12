import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moodLabel } from "@/lib/emotions";
import type { EmotionCode } from "@/services/emotionService";

interface Props {
  emotion: EmotionCode | null;
  confidence: number | null;
  reason: string | null;
  onConfirm: (mediaType: "movie" | "tv") => void;
  onRetry: () => void;
  saving: boolean;
}

export function EmotionResult({ emotion, confidence, reason, onConfirm, onRetry, saving }: Props) {
  const [mediaType, setMediaType] = useState<"movie" | "tv" | null>(null);

  if (!emotion) {
    return (
      <div className="surface-card mx-auto max-w-md rounded-2xl p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {reason === "insufficient_confidence"
            ? "No pudimos detectar tu emoción con claridad. Intenta de nuevo con mejor luz."
            : "No pudimos reconocer tu expresión. Intenta de nuevo."}
        </p>
        <Button className="mt-4" onClick={onRetry}>Volver a intentar</Button>
      </div>
    );
  }

  // FEAR → "Miedo", CALM → "Calma": la clave interna no siempre es el código en minúsculas.
  const label = moodLabel(emotion);

  return (
    <div className="surface-card mx-auto max-w-md rounded-2xl p-6 text-center sm:p-8">
      <p className="eyebrow">Detectamos</p>
      <h3 className="mt-2 text-2xl font-bold text-foreground">{label}</h3>
      {confidence !== null && (
        <p className="mt-1 text-xs text-muted-foreground">
          Confianza: {confidence.toFixed(1)}%
        </p>
      )}
      <p className="mt-6 text-sm text-foreground">¿Querés que te recomendemos una película o una serie?</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant={mediaType === "movie" ? "default" : "outline"}
          onClick={() => setMediaType("movie")}
        >
          Película
        </Button>
        <Button
          variant={mediaType === "tv" ? "default" : "outline"}
          onClick={() => setMediaType("tv")}
        >
          Serie
        </Button>
      </div>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onRetry}>Volver</Button>
        <Button
          className="flex-1"
          disabled={!mediaType || saving}
          onClick={() => mediaType && onConfirm(mediaType)}
        >
          {saving ? <LoaderCircle className="animate-spin" /> : "Confirmar"}
        </Button>
      </div>
    </div>
  );
}