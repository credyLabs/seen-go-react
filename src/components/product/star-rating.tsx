import { Star } from "lucide-react"
import { useTranslation } from "react-i18next"

import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const STAR_COUNT = 5

// Stars fill proportionally: 4.7 -> four full stars, then one 70% filled
export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className="flex">
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const fill = Math.min(Math.max(rating - i, 0), 1)
        return (
          <span key={i} className={cn("relative size-3.5", className)}>
            <Star className="absolute inset-0 size-full fill-muted text-muted" />
            {/* Full-size star clipped to the filled part (from the end side), so it never shrinks */}
            <Star
              className="absolute inset-0 size-full fill-brand-copper text-brand-copper [clip-path:inset(0_var(--empty)_0_0)] rtl:[clip-path:inset(0_0_0_var(--empty))]"
              style={{ "--empty": `${(1 - fill) * 100}%` } as React.CSSProperties}
            />
          </span>
        )
      })}
    </div>
  )
}

export function StarRating({
  rating,
  reviewCount,
  className,
}: {
  rating: number
  reviewCount: number
  className?: string
}) {
  const { t, i18n } = useTranslation()

  return (
    <div
      className={cn("flex items-center gap-1.5 text-xs", className)}
      role="img"
      aria-label={t("landing.product.rating", { rating, count: reviewCount })}
    >
      <Stars rating={rating} />
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground">
        ({formatNumber(reviewCount, i18n.language)})
      </span>
    </div>
  )
}
