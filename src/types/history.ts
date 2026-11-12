/** Clave interna del frontend para cada emoción (colores, etiquetas). */
export type Emotion =
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "disgusted"
  | "surprised"
  | "calm";

/** Códigos del contrato con el backend (catálogo library.moods). */
export type MoodCode =
  | "HAPPY"
  | "SAD"
  | "ANGRY"
  | "FEAR"
  | "DISGUSTED"
  | "SURPRISED"
  | "CALM";

/** Recomendación guardada por el back (dentro de un HistoryEntry). */
export interface SavedRecommendation {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  overview: string | null;
  release_date: string | null;
  vote_average: number | null;
  genre_ids: number[];
  saved_at: string;
  /** Emoción con la que se hizo esta recomendación (puede diferir de la emoción final del día). */
  mood: MoodCode;
  mood_name: string;
  mood_detected_at: string;
}

/** Un día del historial, tal como lo devuelve GET /api/v1/emotions/history. */
export interface HistoryEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  mood: MoodCode;
  name: string; // "Felicidad", "Tristeza", ...
  /** Confianza del análisis (0-100), o null si el usuario eligió la emoción. */
  confidence: number | null;
  source: "AWS_REKOGNITION" | "USER_SELECTED";
  scores: { mood: MoodCode; confidence: number }[];
  detected_at: string;
  recommendations: SavedRecommendation[];
}

/** Respuesta de GET /api/v1/emotions/history. */
export interface HistoryResponse {
  results: HistoryEntry[];
}

/** Respuesta de POST /api/v1/emotions/history. */
export interface SavedMoodResponse extends HistoryEntry {
  replaced: boolean;
}

export type SummaryPeriod = "7d" | "30d" | "year";

export interface MoodCount {
  mood: MoodCode;
  name: string;
  count: number;
}

/** Respuesta de GET /api/v1/emotions/summary: datos del tablero ya agregados por el backend. */
export interface MoodSummary {
  period: SummaryPeriod;
  from: string;
  to: string;
  total_records: number;
  days_with_records: number;
  predominant: MoodCount | null;
  distribution: MoodCount[];
  timeline: { bucket: string; counts: Record<MoodCode, number> }[];
  recommendations: {
    total: number;
    by_media_type: { movie: number; tv: number };
    by_mood: MoodCount[];
    by_genre: { genre_id: number; count: number }[];
    recent: (SavedRecommendation & { date: string })[];
  };
}
