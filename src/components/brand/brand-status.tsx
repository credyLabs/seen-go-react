import { AlertTriangle, RotateCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { BrandMark } from "@/components/brand/brand-mark"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Full-section loader: the animated SeenGo mark with a short caption
export function BrandLoader({ label, className }: { label?: string; className?: string }) {
  const { t } = useTranslation()
  const text = label ?? t("brand.loading")
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-4 py-24 text-center", className)}
    >
      <BrandMark animated className="h-24 w-auto" />
      <p className="text-sm font-medium text-muted-foreground">
        {text}
        {/* Dots that fill in one by one */}
        <span aria-hidden className="inline-flex w-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="motion-safe:animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              .
            </span>
          ))}
        </span>
      </p>
    </div>
  )
}

// Error state with the resting mark and a warning badge, plus an optional retry
export function BrandError({
  title,
  body,
  onRetry,
  retrying = false,
  className,
}: {
  title: string
  body?: string
  onRetry?: () => void
  retrying?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-4 py-20 text-center", className)}>
      <div className="relative">
        <BrandMark muted className="h-24 w-auto" />
        <span className="absolute -end-2 -top-1 flex size-8 items-center justify-center rounded-full bg-destructive text-white shadow-md ring-4 ring-background">
          <AlertTriangle className="size-4" />
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold text-primary dark:text-foreground">{title}</h2>
        {body && <p className="max-w-sm text-sm text-muted-foreground">{body}</p>}
      </div>
      {onRetry && (
        <Button onClick={onRetry} disabled={retrying} className="rounded-full bg-brand-gradient px-6 text-white shadow-md hover:opacity-90">
          <RotateCw className={retrying ? "motion-safe:animate-spin" : undefined} />
          {t("brand.retry")}
        </Button>
      )}
    </div>
  )
}
