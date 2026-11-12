import { useCallback, useEffect, useState } from "react";
import { getSummary } from "@/services/historyService";
import type { MoodSummary, SummaryPeriod } from "@/types/history";

/** Datos del tablero ya agregados por el backend (GET /api/v1/emotions/summary). */
export function useMoodSummary(period: SummaryPeriod) {
  const [summary, setSummary] = useState<MoodSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await getSummary(period));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar tu resumen.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { summary, loading, error, reload };
}
