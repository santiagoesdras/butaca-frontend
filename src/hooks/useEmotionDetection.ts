import { useCallback, useState } from "react";
import {
  analyzeEmotion,
  blobToBase64,
  AnalysisError,
  type AnalyzeResponse,
} from "@/services/emotionService";
import {
  saveDetection,
  grantCameraConsent,
  getCameraConsent,
} from "@/services/historyService";

export type DetectionStep =
  | "idle"
  | "analyzing"
  | "confirming"
  | "saving"
  | "done"
  | "error";

export function useEmotionDetection() {
  const [step, setStep] = useState<DetectionStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [canRetrySameImage, setCanRetrySameImage] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);

  const ensureConsent = useCallback(async () => {
    const granted = await getCameraConsent();
    if (!granted) {
      await grantCameraConsent();
    }
  }, []);

  const analyze = useCallback(async (blob: Blob): Promise<boolean> => {
    setStep("analyzing");
    setError(null);
    setPendingBlob(blob); // guardamos antes del fetch para poder reintentar si el error fue de servidor
    try {
      const result = await analyzeEmotion(blob);
      setAnalysis(result);
      setStep("confirming");
      return true;
    } catch (e) {
      if (e instanceof AnalysisError) {
        setError(e.message);
        setCanRetrySameImage(e.canRetrySameImage);
      } else {
        setError(e instanceof Error ? e.message : "No se pudo analizar la imagen.");
        setCanRetrySameImage(true);
      }
      setStep("error");
      return false;
    }
  }, []);

  /** Reintenta el análisis usando la última imagen capturada, sin volver a encender la cámara. */
  const retryAnalyze = useCallback(async (): Promise<boolean> => {
    if (!pendingBlob) return false;
    return analyze(pendingBlob);
  }, [pendingBlob, analyze]);

  /** Limpia el error manteniendo la cámara montada (para tomar una foto nueva). */
  const clearError = useCallback(() => {
    setError(null);
    setCanRetrySameImage(false);
    setStep("idle");
    setPendingBlob(null);
  }, []);

  const saveWithEmotion = useCallback(
    async (emotion: string, timeZone: string) => {
      if (!pendingBlob) {
        setError("No hay imagen pendiente.");
        setStep("error");
        return null;
      }
      setStep("saving");
      try {
        await ensureConsent();
        const base64 = await blobToBase64(pendingBlob);
        const record = await saveDetection(base64, timeZone);
        setSavedId(record.id);
        setStep("done");
        return record.id;
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "No se pudo guardar la detección."
        );
        setStep("error");
        return null;
      }
    },
    [pendingBlob, ensureConsent]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setCanRetrySameImage(false);
    setAnalysis(null);
    setSavedId(null);
    setPendingBlob(null);
  }, []);

  return {
    step,
    error,
    canRetrySameImage,
    analysis,
    savedId,
    analyze,
    retryAnalyze,
    clearError,
    saveWithEmotion,
    reset,
  };
}
