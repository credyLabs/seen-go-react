import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { RotateCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { activeItems, homeQueryOptions, sortSections } from "@/api/home"
import { HeroBanners } from "@/components/home/hero-banners"
import { HomeSection } from "@/components/home/home-section"
import { ServiceHighlights } from "@/components/home/service-highlights"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_public/")({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      {/* Both read GET /catalogue/home: BANNER sections feed the hero, the rest render below */}
      <HeroBanners />
      <HomeSections />
    </div>
  )
}

function HomeSections() {
  const { i18n } = useTranslation()
  const { data, isPending, isError, refetch, isRefetching } = useQuery(
    homeQueryOptions(i18n.language)
  )

  if (isPending) return <HomeSkeleton />
  if (isError) return <HomeError onRetry={() => refetch()} retrying={isRefetching} />

  const sections = sortSections(data.sections)
  const benefits = sections.find((section) => section.type === "FOOTER_BENEFIT")

  return (
    <>
      {sections.map((section) => (
        <HomeSection key={section.id} section={section} />
      ))}
      {benefits && activeItems(benefits).length > 0 && (
        <ServiceHighlights
          items={activeItems(benefits).map((item) => ({
            id: item.id,
            title: item.label ?? "",
            description: item.description,
            iconKey: item.iconKey,
            linkUrl: item.linkUrl,
          }))}
        />
      )}
    </>
  )
}

function HomeSkeleton() {
  const { t } = useTranslation()
  return (
    <div role="status" aria-label={t("landing.loading")} className="flex animate-pulse flex-col gap-10">
      {[0, 1].map((row) => (
        <div key={row} className="flex flex-col gap-4">
          <div className="h-7 w-56 rounded-md bg-muted" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-72 w-60 shrink-0 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function HomeError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-xl font-semibold">{t("landing.error.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("landing.error.body")}</p>
      <Button onClick={onRetry} disabled={retrying} className="rounded-full">
        <RotateCw className={retrying ? "animate-spin" : undefined} />
        {t("landing.error.retry")}
      </Button>
    </div>
  )
}
