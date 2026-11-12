
import type { ReactNode } from "react"
import { Film } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        {icon ?? <Film className="size-7" aria-hidden="true" />}
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
