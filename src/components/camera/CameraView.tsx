import { Camera, X, LoaderCircle, AlertCircle, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { useCamera } from "@/hooks/useCamera";
import { Button } from "@/components/ui/button";

interface Props {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  analyzing: boolean;
  /** Error devuelto por el servicio de análisis (422, 502, red, etc.) */
  analyzeError?: string | null;
  /** Indica si la imagen actual se puede reintentar enviar (true para 502/red; false para 422 de detección facial). */
  canRetryAnalysis?: boolean;
  /** Reintenta el envío con la última imagen capturada, sin volver a encender la cámara. */
  onRetryAnalysis?: () => void;
  /** Descarta el error y permite tomar una nueva foto (la cámara ya sigue encendida). */
  onNewCapture?: () => void;
}

export function CameraView({
  onCapture,
  onClose,
  analyzing,
  analyzeError,
  canRetryAnalysis = false,
  onRetryAnalysis,
  onNewCapture,
}: Props) {
  const { videoRef, status, error: cameraError, start, stop, capture } = useCamera();

  useEffect(() => {
    void start();
    return () => stop();
  }, [start, stop]);

  async function handleCapture() {
    const blob = await capture();
    if (blob) onCapture(blob);
  }

  const hasAnalyzeError = Boolean(analyzeError);

  return (
    <div className="surface-card mx-auto max-w-lg overflow-hidden rounded-2xl">
      <div className="relative aspect-video bg-background">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar cámara"
          className="absolute right-3 top-3 rounded-full bg-background/80 p-2 text-foreground hover:bg-background"
        >
          <X size={18} />
        </button>

        {/* Overlay: solicitando permisos o encendiendo */}
        {status === "requesting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <LoaderCircle className="size-8 animate-spin text-accent" />
          </div>
        )}

        {/* Overlay: error de cámara (permiso denegado, no encontrada, ocupada, etc.) */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90 p-6 text-center text-sm text-red-400">
            <AlertCircle className="size-8 text-destructive" />
            <p>{cameraError}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void start()}>
                Reintentar
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {/* Overlay: error del servicio de análisis (422, 502, red, etc.) — cámara sigue activa */}
        {hasAnalyzeError && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/95 p-6 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{analyzeError}</p>
              {!canRetryAnalysis && (
                <p className="text-xs text-muted-foreground">
                  Asegúrate de tener buena iluminación y centrar un único rostro en la cámara.
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {canRetryAnalysis && onRetryAnalysis && (
                <Button size="sm" onClick={onRetryAnalysis} disabled={analyzing} className="gap-1.5">
                  <RefreshCw size={14} className={analyzing ? "animate-spin" : undefined} />
                  Reintentar envío
                </Button>
              )}
              {onNewCapture && (
                <Button
                  size="sm"
                  variant={canRetryAnalysis ? "secondary" : "default"}
                  onClick={onNewCapture}
                  disabled={analyzing}
                  className="gap-1.5"
                >
                  <RotateCcw size={14} />
                  Tomar otra foto
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onClose} disabled={analyzing}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior con botón de captura */}
      <div className="flex justify-center p-4">
        <Button
          onClick={handleCapture}
          disabled={status !== "active" || analyzing || hasAnalyzeError}
          className="gap-2"
        >
          {analyzing ? <LoaderCircle className="animate-spin" /> : <Camera />}
          {analyzing ? "Analizando..." : "Capturar y analizar"}
        </Button>
      </div>
    </div>
  );
}
