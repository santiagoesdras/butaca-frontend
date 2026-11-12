import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, description, action, eyebrow }: PageHeaderProps) {
  return (
    <header className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-4">
        {eyebrow && (
          <p className="flex items-center gap-3 eyebrow">
            <span className="h-px w-8 bg-accent/60" />
            {eyebrow}
          </p>
        )}

        <h1 className="title-poster wrap-break-word text-4xl text-foreground hyphens-auto sm:text-5xl md:text-6xl lg:text-7xl">
            {title}
        </h1>

        {description && (
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="flex shrink-0 items-center gap-2 pb-1">{action}</div>
      )}
    </header>
  );
}