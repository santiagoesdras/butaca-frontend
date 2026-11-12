import type { Emotion, HistoryEntry, MoodCode } from "@/types/history";

/**
 * Etiqueta y color de cada emoción. Las claves son internas del frontend; el contrato con el
 * backend usa los códigos en mayúsculas (MoodCode). Deben estar las siete del catálogo.
 */
export const EMOTIONS: Record<
  Emotion,
  { label: string; color: string }
> = {
  happy: {
    label: "Felicidad",
    color: "#E5B84B",
  },
  sad: {
    label: "Tristeza",
    color: "#568CCB",
  },
  angry: {
    label: "Enojo",
    color: "#E45B48",
  },
  fearful: {
    label: "Miedo",
    color: "#9A78C5",
  },
  disgusted: {
    label: "Asco",
    color: "#79A66A",
  },
  surprised: {
    label: "Sorpresa",
    color: "#DD873F",
  },
  calm: {
    label: "Calma",
    color: "#4FB3A9",
  },
};

/** Mapea el código del back (HAPPY) al key del front (happy). */
const BACKEND_TO_FRONTEND: Record<MoodCode, Emotion> = {
  HAPPY: "happy",
  SAD: "sad",
  ANGRY: "angry",
  FEAR: "fearful",
  DISGUSTED: "disgusted",
  SURPRISED: "surprised",
  CALM: "calm",
};

export function toFrontendEmotion(mood: string): Emotion | null {
  return BACKEND_TO_FRONTEND[mood.toUpperCase() as MoodCode] ?? null;
}

/** Mapea el key del front (happy) al código del back (HAPPY). */
export function toBackendMood(emotion: Emotion): MoodCode {
  const map: Record<Emotion, MoodCode> = {
    happy: "HAPPY",
    sad: "SAD",
    angry: "ANGRY",
    fearful: "FEAR",
    disgusted: "DISGUSTED",
    surprised: "SURPRISED",
    calm: "CALM",
  };
  return map[emotion];
}

/** Etiqueta en español de un código del backend (por ejemplo, FEAR → "Miedo"). */
export function moodLabel(mood: string): string {
  const emotion = toFrontendEmotion(mood);
  return emotion ? EMOTIONS[emotion].label : mood;
}

/**
 * Extrae la primera emoción (por `detected_at`) de un conjunto de entradas.
 * Se mantiene la firma para compatibilidad con código existente, pero ahora
 * trabaja con `HistoryEntry` en lugar de `EmotionRecord` (que ya no existe).
 */
export function getFirstEmotion(entries: HistoryEntry[]): Emotion | null {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime()
  );

  return toFrontendEmotion(sorted[0].mood);
}
