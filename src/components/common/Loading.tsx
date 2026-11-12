
import { LoaderCircle } from "lucide-react"
import { cn } from "cn"

interface LoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const iconSizes = {
  sm: "size-5",
  md: "size-8",
  lg: "size-12",
}

export function Loading({
  message = "Cargando...",
  size = "md",
  className,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-64 w-full flex-col items-center justify-center gap-4 text-center text-muted-foreground",
        className
      )}
    >
      <LoaderCircle
        className={cn(iconSizes[size], "animate-spin text-primary")}
        aria-hidden="true"
      />

      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
