import { useCallback, useEffect, useState } from "react";
import { getHistory, type HistoryRange } from "@/services/historyService";
import type { HistoryEntry } from "@/types/history";

export function useMoodHistory(range: HistoryRange = { period: "30d" }) {
  // Clave estable para no repetir la consulta en cada render.
  const key = "year" in range ? `year:${range.year}` : `period:${range.period}`;
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistory(
        key.startsWith("year:") ? { year: Number(key.slice(5)) } : { period: key.slice(7) as "7d" | "30d" }
      );
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { entries, loading, error, reload };
}