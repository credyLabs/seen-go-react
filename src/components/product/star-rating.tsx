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
            <span
              className="absolute inset-y-0 start-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="size-full max-w-none fill-brand-copper text-brand-copper" />
            </span>
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
