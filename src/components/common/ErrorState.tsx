
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = "Algo salió mal",
  message = "No pudimos cargar la información. Inténtalo nuevamente.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-7" aria-hidden="true" />
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Intentar nuevamente
        </Button>
      )}
    </div>
  )
}
