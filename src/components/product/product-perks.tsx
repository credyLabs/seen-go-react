import { CreditCard, MapPin, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import { useEffect, useState, type ComponentType } from "react"
import { useTranslation } from "react-i18next"

// Orders placed before this local hour go out the same day
const SAME_DAY_CUTOFF_HOUR = 16
const MINUTE_MS = 60 * 1000

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), MINUTE_MS)
    return () => clearInterval(id)
  }, [])
  return now
}

function Perk({
  icon: Icon,
  title,
  note,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  note: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-brand-navy dark:text-foreground">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  )
}

export function ProductPerks({ brand, warrantyYears }: { brand: string; warrantyYears: number }) {
  const { t, i18n } = useTranslation()
  const now = useNow()

  const cutoff = new Date(now)
  cutoff.setHours(SAME_DAY_CUTOFF_HOUR, 0, 0, 0)
  const minutesLeft = Math.floor((cutoff.getTime() - now.getTime()) / MINUTE_MS)
  const sameDayNote =
    minutesLeft > 0
      ? t("productPage.perks.sameDayCountdown", {
          hours: Math.floor(minutesLeft / 60),
          minutes: minutesLeft % 60,
        })
      : t("productPage.perks.sameDayTomorrow")

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const deliveryDate = tomorrow.toLocaleDateString(i18n.language, {
    month: "long",
    day: "numeric",
    numberingSystem: "latn",
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Perk icon={Truck} title={t("productPage.perks.sameDay")} note={sameDayNote} />
        <Perk
          icon={ShieldCheck}
          title={t("productPage.perks.warranty", { count: warrantyYears, brand })}
          note={t("productPage.perks.warrantyNote")}
        />
        <Perk
          icon={RotateCcw}
          title={t("productPage.perks.returns")}
          note={t("productPage.perks.returnsNote")}
        />
        <Perk
          icon={CreditCard}
          title={t("productPage.perks.installments")}
          note={t("productPage.perks.installmentsNote")}
        />
      </div>

      <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
        <MapPin className="mt-0.5 size-4 shrink-0 text-brand-copper" />
        <div className="text-xs">
          <p>
            {/* TODO: use the signed-in user's saved address */}
            <span className="font-medium">
              {t("productPage.deliverTo", { area: "Dubai Marina" })}
            </span>{" "}
            ·{" "}
            <button type="button" className="font-medium underline-offset-2 hover:underline">
              {t("productPage.change")}
            </button>
          </p>
          <p className="mt-0.5 text-muted-foreground">
            {t("productPage.deliveryEta", { date: deliveryDate })}
          </p>
        </div>
      </div>
    </div>
  )
}
