import {
  BadgeCheck,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

export interface Highlight {
  id: string
  title: string
  description?: string | null
  // Icon name from the API, e.g. "shield-check"
  iconKey?: string | null
  // Used to pick an icon when iconKey is missing, e.g. "/pages/warranty"
  linkUrl?: string | null
}

const ICONS: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  truck: Truck,
  "credit-card": CreditCard,
  "rotate-ccw": RotateCcw,
}

// Newer responses send no iconKey, so match the benefit's page instead
const ICON_BY_LINK: [RegExp, LucideIcon][] = [
  [/warranty/, ShieldCheck],
  [/shipping|delivery/, Truck],
  [/payment|installment/, CreditCard],
  [/return/, RotateCcw],
]

function iconFor(highlight: Highlight): LucideIcon {
  if (highlight.iconKey && ICONS[highlight.iconKey]) return ICONS[highlight.iconKey]
  const link = highlight.linkUrl ?? ""
  return ICON_BY_LINK.find(([pattern]) => pattern.test(link))?.[1] ?? BadgeCheck
}

// Translated copy for pages that don't load the benefits from the API
const DEFAULT_KEYS = [
  { key: "warranty", iconKey: "shield-check" },
  { key: "delivery", iconKey: "truck" },
  { key: "installments", iconKey: "credit-card" },
  { key: "returns", iconKey: "rotate-ccw" },
] as const

export function ServiceHighlights({ items }: { items?: Highlight[] }) {
  const { t } = useTranslation()
  const highlights: Highlight[] =
    items ??
    DEFAULT_KEYS.map(({ key, iconKey }) => ({
      id: key,
      title: t(`landing.highlights.items.${key}.title`),
      description: t(`landing.highlights.items.${key}.description`),
      iconKey,
    }))

  return (
    <section aria-label={t("landing.highlights.label")}>
      <ul className="grid gap-5 rounded-2xl border bg-card p-5 shadow-xs sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        {highlights.map((highlight) => {
          const Icon = iconFor(highlight)
          return (
            <li
              key={highlight.id}
              // Title-only benefits sit centred against the icon
              className={cn("flex gap-3", highlight.description ? "items-start" : "items-center")}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-brand-navy dark:text-foreground">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-bidi-plain text-sm font-semibold">{highlight.title}</h3>
                {highlight.description && (
                  <p className="text-bidi-plain mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {highlight.description}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
