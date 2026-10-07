import { useState } from "react"
import { useTranslation } from "react-i18next"

import { ScrollRail } from "@/components/home/scroll-rail"
import { CarouselItem } from "@/components/ui/carousel"

export interface BrandTile {
  id: string
  name: string
  logoUrl: string | null
}

// Shows the logo when it loads, otherwise just the name
function BrandLogo({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-8 max-w-24 object-contain select-none"
    />
  )
}

export function TopBrands({
  title,
  subtitle,
  brands,
}: {
  title: string
  subtitle?: string
  brands: BrandTile[]
}) {
  const { t } = useTranslation()

  return (
    <ScrollRail
      title={title}
      subtitle={subtitle}
      seeAllLabel={t("landing.brands.seeAll")}
      contentClassName="-ms-3"
    >
      {brands.map((brand) => (
        <CarouselItem key={brand.id} className="basis-auto ps-3">
          {/* TODO: link to the brand listing once the search page exists */}
          <a
            href="#"
            draggable={false}
            className="flex h-full min-h-20 w-32 flex-col items-center justify-center gap-2 rounded-2xl border bg-card px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            {brand.logoUrl && <BrandLogo src={brand.logoUrl} />}
            <span className="line-clamp-1 text-base font-bold tracking-tight">{brand.name}</span>
          </a>
        </CarouselItem>
      ))}
    </ScrollRail>
  )
}
