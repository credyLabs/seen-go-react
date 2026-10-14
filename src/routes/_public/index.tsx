import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { activeItems, sortSections } from "@/api/home"
import { BrandError, BrandLoader } from "@/components/brand/brand-status"
import { HeroBanners } from "@/components/home/hero-banners"
import { HomeSection } from "@/components/home/home-section"
import { ServiceHighlights } from "@/components/home/service-highlights"
import { useHomeData } from "@/stores/home-store"

export const Route = createFileRoute("/_public/")({
  component: HomePage,
})

function HomePage() {
  const { t, i18n } = useTranslation()
  const { data, isError, retry, isRetrying } = useHomeData(i18n.language)

  // One branded loader / error for the whole page instead of per-section placeholders
  if (isError) {
    return (
      <BrandError
        title={t("landing.error.title")}
        body={t("landing.error.body")}
        onRetry={retry}
        retrying={isRetrying}
      />
    )
  }
  if (!data) return <BrandLoader label={t("landing.loading")} className="min-h-[60svh]" />

  return (
    <div className="flex flex-col gap-10">
      {/* Both read GET /catalogue/home from the home store (loaded on first visit):
          BANNER sections feed the hero, the rest render below */}
      <HeroBanners />
      <HomeSections />
    </div>
  )
}

function HomeSections() {
  const { i18n } = useTranslation()
  const { data } = useHomeData(i18n.language)
  // HomePage only renders this once the data is in
  if (!data) return null

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
