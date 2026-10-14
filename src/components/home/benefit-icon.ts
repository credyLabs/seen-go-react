import {
  BadgeCheck,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react"

import type { Highlight } from "@/components/home/service-highlights"

// Icon for a service benefit (warranty, delivery, ...), shared by the home
// strip and the product page's service cards

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

export function iconFor(highlight: Pick<Highlight, "iconKey" | "linkUrl">): LucideIcon {
  if (highlight.iconKey && ICONS[highlight.iconKey]) return ICONS[highlight.iconKey]
  const link = highlight.linkUrl ?? ""
  return ICON_BY_LINK.find(([pattern]) => pattern.test(link))?.[1] ?? BadgeCheck
}
