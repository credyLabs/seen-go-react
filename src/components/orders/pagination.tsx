import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// 1-based page numbers to show: first, last and the current page's neighbours,
// with "…" where pages are skipped, e.g. 1 2 3 … 12
function pageList(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1])
  if (current <= 3) [2, 3].forEach((p) => pages.add(p))
  if (current >= total - 2) [total - 1, total - 2].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  return sorted.flatMap((page, i) => (i > 0 && page - sorted[i - 1] > 1 ? ["gap" as const, page] : [page]))
}

const SQUARE = "size-8 rounded-md p-0 text-xs"

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  // 1-based
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  return (
    <nav aria-label={t("orders.pagination")} className="flex items-center justify-end gap-1.5">
      <Button
        variant="ghost"
        className={SQUARE}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label={t("orders.previousPage")}
      >
        <ChevronLeft className="rtl:rotate-180" />
      </Button>
      {pageList(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? "default" : "outline"}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onChange(item)}
            className={cn(SQUARE, item === page && "bg-secondary text-secondary-foreground hover:bg-secondary/90")}
          >
            {item}
          </Button>
        )
      )}
      <Button
        variant="ghost"
        className={SQUARE}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label={t("orders.nextPage")}
      >
        <ChevronRight className="rtl:rotate-180" />
      </Button>
    </nav>
  )
}
