import { CreditCard, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import { useTranslation } from "react-i18next"

const HIGHLIGHTS = [
  { key: "warranty", icon: ShieldCheck },
  { key: "delivery", icon: Truck },
  { key: "installments", icon: CreditCard },
  { key: "returns", icon: RotateCcw },
] as const

export function ServiceHighlights() {
  const { t } = useTranslation()

  return (
    <section aria-label={t("landing.highlights.label")}>
      <ul className="grid gap-5 rounded-2xl border bg-card p-5 shadow-xs sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        {HIGHLIGHTS.map(({ key, icon: Icon }) => (
          <li key={key} className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-brand-navy dark:text-foreground">
              <Icon className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">
                {t(`landing.highlights.items.${key}.title`)}
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {t(`landing.highlights.items.${key}.description`)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
